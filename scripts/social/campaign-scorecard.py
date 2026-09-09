#!/usr/bin/env python3
"""Validate a private scorecard and render a local review; no network or writes to posts."""
import argparse
import json
import math
from pathlib import Path

METRICS = ("platform_reach", "platform_link_clicks", "production_campaign_sessions", "qualified_inquiries", "paid_orders_deterministic", "paid_orders_customer_reported", "attributed_paid_revenue_cad")


def validate(card):
    if card.get("schema") != "truecolor-campaign-scorecard" or card.get("version") != 1:
        raise ValueError("Unsupported scorecard schema")
    if card.get("status") not in ("not_launched", "awaiting_publication", "collecting", "reviewed"):
        raise ValueError("Invalid status")
    for group in ("campaign_metrics", "comparison_metrics", "delivery"):
        for key, value in card.get(group, {}).items():
            if key.endswith("file"):
                continue
            if value is not None and (isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or value < 0):
                raise ValueError(f"{group}.{key} must be null or a finite nonnegative number")
    current = card.get("campaign_metrics", {})
    if any(key not in current for key in METRICS):
        raise ValueError("Missing campaign metric fields; unavailable metrics must explicitly be null")
    if card["status"] in ("not_launched", "awaiting_publication") and any(value is not None for value in current.values()):
        raise ValueError("Unpublished campaign metrics must remain null")
    has_metrics = any(value is not None for group in ("campaign_metrics", "comparison_metrics") for value in card.get(group, {}).values())
    if has_metrics:
        from datetime import date
        for name in ("window", "comparison_window"):
            window = card.get(name, {})
            try:
                start = date.fromisoformat(window["start_inclusive"])
                end = date.fromisoformat(window["end_inclusive"])
            except (KeyError, TypeError, ValueError) as exc:
                raise ValueError(f"{name} requires inclusive ISO dates") from exc
            if start > end or not window.get("timezone"):
                raise ValueError(f"Invalid {name}")
        if not card.get("sources"):
            raise ValueError("Observed metrics require evidence sources")
        for source in card["sources"]:
            for field in ("source", "private_report_file", "retrieved_at", "timezone", "attribution_definition"):
                if not source.get(field):
                    raise ValueError(f"Evidence source missing {field}")
    lesson = card.get("lesson", {})
    if lesson.get("classification") not in ("observed", "hypothesis", "accepted_decision"):
        raise ValueError("Invalid lesson classification")
    if lesson.get("classification") == "accepted_decision" and (lesson.get("owner_decision") != "accepted" or not lesson.get("decision_date") or not lesson.get("proposed_change")):
        raise ValueError("Accepted decisions require owner acceptance, date and concrete change")
    return card


def render(card, prior_cards):
    validate(card)
    lines = [f"# Campaign review: {card['campaign_key']}", "", f"Status: {card['status']}. This is a private local review; no publication or spend action.", "", "| Measure | Current | Comparison |", "| --- | --- | --- |"]
    def show(value):
        return "Unavailable / unverified" if value is None else str(value)
    for key in METRICS:
        lines.append(f"| {key} | {show(card['campaign_metrics'].get(key))} | {show(card.get('comparison_metrics', {}).get(key))} |")
    lines += ["", "Qualified inquiries, paid orders and clicks are distinct. Deterministic and customer-reported order cohorts must be deduplicated. Attributed revenue is neither margin nor incremental lift.", "", "## Evidence limits", ""]
    lines += [f"- {limit}" for limit in card.get("coverage", {}).get("limitations", [])] or ["- No limits entered; this is not proof of complete tracking."]
    lines += [f"- Revenue tracking reliability: {show(card.get('coverage', {}).get('tracking_reliable_for_revenue'))}", "- Contribution margin and acceptable acquisition cost are not supplied by this scorecard.", "", "## Accepted decisions for the next brief", ""]
    accepted = []
    for previous in prior_cards:
        validate(previous)
        lesson = previous.get("lesson", {})
        if previous.get("campaign_key") == card["campaign_key"] and lesson.get("classification") == "accepted_decision":
            accepted.append(lesson)
    # Order and retain history; explicit supersession is shown for human review, never silently erased.
    for lesson in sorted(accepted, key=lambda item: item["decision_date"]):
        accepted_line = f"- {lesson['decision_date']}: {lesson['proposed_change']}"
        if lesson.get("supersedes"):
            accepted_line += f" (supersedes {lesson['supersedes']})"
        lines.append(accepted_line)
    if not accepted:
        lines.append("- No validated accepted decision inputs. Continue the owning campaign brief; do not promote an unaccepted recommendation.")
    lesson = card.get("lesson", {})
    lines += ["", "## Current review proposal — requires owner decision", "", f"Observation: {lesson.get('observation') or 'Not entered'}", f"Competing explanation: {lesson.get('competing_explanation') or 'Not entered'}", f"Proposed change: {lesson.get('proposed_change') or 'No change proposed; collect evidence'}", f"Confidence: {lesson.get('confidence', 'insufficient_data')}", "", "No automatic winner, budget change or campaign rewrite is inferred.", ""]
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("scorecard", type=Path)
    parser.add_argument("--decisions", type=Path, nargs="*", default=[])
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    try:
        card = json.loads(args.scorecard.read_text())
        prior = [json.loads(path.read_text()) for path in args.decisions]
        output = render(card, prior)
    except (OSError, ValueError, TypeError, KeyError) as exc:
        parser.error(str(exc))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(output)
    print(f"Wrote private review: {args.output}")


if __name__ == "__main__":
    main()
