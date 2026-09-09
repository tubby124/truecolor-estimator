import copy
import importlib.util
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[3]
spec = importlib.util.spec_from_file_location("scorecard", ROOT / "scripts/social/campaign-scorecard.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class ScorecardTests(unittest.TestCase):
    def setUp(self):
        self.card = json.loads((ROOT / "docs/social/campaigns/SCORECARD-TEMPLATE.json").read_text())

    def test_unlaunched_remains_unknown(self):
        rendered = module.render(self.card, [])
        self.assertIn("Unavailable / unverified", rendered)
        self.card["campaign_metrics"]["paid_orders_deterministic"] = 0
        with self.assertRaisesRegex(ValueError, "must remain null"):
            module.validate(self.card)

    def test_observation_requires_dated_evidence(self):
        self.card["status"] = "collecting"
        self.card["campaign_metrics"]["qualified_inquiries"] = 0
        with self.assertRaisesRegex(ValueError, "ISO dates"):
            module.validate(self.card)
        for key in ("window", "comparison_window"):
            self.card[key].update(start_inclusive="2026-09-01", end_inclusive="2026-09-07")
        with self.assertRaisesRegex(ValueError, "evidence sources"):
            module.validate(self.card)
        self.card["sources"] = [{"source": "synthetic test", "private_report_file": "fixture.json", "retrieved_at": "2026-09-09T00:00:00Z", "timezone": "America/Regina", "attribution_definition": "staff-qualified and deduplicated"}]
        self.assertIn("| qualified_inquiries | 0 |", module.render(self.card, []))

    def test_only_accepted_same_campaign_decisions_feed_next_brief(self):
        proposal = copy.deepcopy(self.card)
        proposal["lesson"]["proposed_change"] = "UNACCEPTED CHANGE"
        accepted = copy.deepcopy(self.card)
        accepted["lesson"].update(classification="accepted_decision", owner_decision="accepted", decision_date="2026-09-09", proposed_change="ACCEPTED CHANGE")
        unrelated = copy.deepcopy(accepted)
        unrelated["campaign_key"] = "other-business"
        unrelated["lesson"]["proposed_change"] = "UNRELATED CHANGE"
        rendered = module.render(self.card, [proposal, accepted, unrelated])
        self.assertIn("ACCEPTED CHANGE", rendered)
        self.assertNotIn("UNACCEPTED CHANGE", rendered)
        self.assertNotIn("UNRELATED CHANGE", rendered)
        accepted["lesson"]["owner_decision"] = "pending"
        with self.assertRaisesRegex(ValueError, "owner acceptance"):
            module.validate(accepted)

    def test_invalid_numbers_rejected(self):
        for value in (-1, float("nan"), True):
            self.card["delivery"]["verified_published_destinations"] = value
            with self.assertRaises(ValueError):
                module.validate(self.card)


if __name__ == "__main__":
    unittest.main()
