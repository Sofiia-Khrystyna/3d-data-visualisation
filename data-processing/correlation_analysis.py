"""
Sensor-Component Correlation Analysis
======================================
Bachelor Thesis: Visualizing Multivariate Temporal Industrial Data in 3D
Author: Sofiia-Khrystyna Borysiuk

This script quantifies which hydraulic sensors are most predictive of each
component's health state, using Pearson correlation analysis on the
aggregated cycle dataset (hydraulic_data.csv).

The results justify which axis combinations are used in the 3D prototype
and which components are selected for the user study tasks.

Dataset: UCI Hydraulic System dataset
  - 2,205 cycles, 17 sensors, 5 component health labels
  - hydraulic_data.csv: per-cycle aggregated sensor means + health labels
"""

import pandas as pd
import numpy as np
from scipy import stats
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import os

# ── Load data ─────────────────────────────────────────────────────────────────
df = pd.read_csv("public/hydraulic_data.csv")

print(f"Dataset loaded: {len(df)} cycles, {len(df.columns)} columns")
print(f"Columns: {list(df.columns)}\n")

# ── Sensor columns ─────────────────────────────────────────────────────────────
# The aggregated dataset provides per-cycle mean values for each sensor.
# These are the columns ending in '_mean'.
sensor_cols = [c for c in df.columns if c.endswith("_mean")]
sensor_names = [c.replace("_mean", "") for c in sensor_cols]

print(f"Sensors found ({len(sensor_cols)}): {sensor_names}\n")

# ── Health score mappings ──────────────────────────────────────────────────────
# To compute Pearson correlation, we need numeric values.
# Each component's categorical label is mapped to an ordinal health score
# where higher = healthier. The order reflects the severity of degradation
# as described in the dataset documentation.
#
# Reference:
#   Nikolai Helwig, Eliseo Pignanelli, Andreas Schütze (2015).
#   "Condition Monitoring of a Complex Hydraulic System Using
#   Multivariate Statistics". IEEE ETFA 2015.

HEALTH_SCORES = {
    "cooler_label": {
        "full_efficiency":    3,   # cooler working at full capacity
        "reduced_efficiency": 2,   # cooler partially degraded
        "near_failure":       1,   # cooler close to breakdown
    },
    "valve_label": {
        "optimal":    4,           # valve operating normally
        "small_lag":  3,           # slight response delay
        "severe_lag": 1,           # major response lag
    },
    "pump_label": {
        "no_leakage":     3,       # no internal leakage detected
        "weak_leakage":   2,       # minor internal leakage
        "severe_leakage": 1,       # severe internal leakage
    },
    "accumulator_label": {
        "optimal":           4,    # accumulator pressure normal
        "slightly_reduced":  3,    # slight pressure loss
        "severely_reduced":  2,    # major pressure loss
        "near_failure":      1,    # accumulator close to failure
    },
    "stable_label": {
        "stable":   2,             # system operating stably
        "unstable": 1,             # system operating unstably
    },
}

# ── Pearson correlation analysis ───────────────────────────────────────────────
# For each component, we compute the Pearson correlation coefficient r
# between each sensor's mean value and the component's health score.
#
# Pearson r measures the linear relationship between two variables:
#   r = +1.0  perfect positive correlation (sensor rises as health improves)
#   r = -1.0  perfect negative correlation (sensor rises as health worsens)
#   r =  0.0  no linear relationship
#
# We also compute the p-value to test statistical significance.
# All results with p < 0.001 are marked ***, meaning the probability
# of the correlation occurring by chance is less than 0.1%.

print("=" * 65)
print("PEARSON CORRELATION: sensor mean vs component health score")
print("=" * 65)

results = {}  # store for plotting

for comp_col, score_map in HEALTH_SCORES.items():
    comp_name = comp_col.replace("_label", "").upper()

    # Assign numeric health scores to each cycle
    working = df.copy().dropna(subset=[comp_col])
    working["health_score"] = working[comp_col].map(score_map)
    working = working.dropna(subset=["health_score"])

    n = len(working)
    print(f"\n{comp_name}  (n={n} cycles)")
    print(f"  {'Sensor':<8} {'r':>7}  {'p-value':>10}  {'sig':>5}  Direction")
    print(f"  {'-'*8} {'-'*7}  {'-'*10}  {'-'*5}  {'-'*25}")

    comp_results = []
    for col, name in zip(sensor_cols, sensor_names):
        r, p = stats.pearsonr(working[col], working["health_score"])

        # Significance stars (standard academic convention)
        if   p < 0.001: sig = "***"
        elif p < 0.01:  sig = "**"
        elif p < 0.05:  sig = "*"
        else:           sig = "n.s."

        # Direction: does the sensor rise or fall as the component degrades?
        direction = "rises as health worsens" if r < 0 else "falls as health worsens"

        comp_results.append({
            "sensor":    name,
            "r":         r,
            "abs_r":     abs(r),
            "p":         p,
            "sig":       sig,
            "direction": direction,
        })

    # Sort by absolute r value descending
    comp_results.sort(key=lambda x: x["abs_r"], reverse=True)
    results[comp_name] = comp_results

    # Print top 5
    for res in comp_results[:5]:
        print(f"  {res['sensor']:<8} {res['r']:>+7.3f}  {res['p']:>10.2e}  {res['sig']:>5}  {res['direction']}")

# ── Interpretation thresholds ──────────────────────────────────────────────────
# Based on Cohen (1988), commonly used thresholds for correlation strength:
#   |r| >= 0.90  → very strong  (excellent for visual detection)
#   |r| >= 0.30  → moderate     (detectable with guidance)
#   |r| <  0.20  → weak         (not reliable for visual tasks)

print("\n\n" + "=" * 65)
print("INTERPRETATION SUMMARY")
print("=" * 65)
print("Threshold: |r| >= 0.90 = very strong, >= 0.30 = moderate, < 0.20 = weak\n")

RECOMMENDED_AXES = {}

for comp_name, comp_results in results.items():
    top = comp_results[0]
    abs_r = top["abs_r"]

    if abs_r >= 0.90:
        strength = "VERY STRONG — suitable for user study"
    elif abs_r >= 0.30:
        strength = "MODERATE — detectable with guidance"
    else:
        strength = "WEAK — not reliable for visual detection"

    top3 = [r["sensor"] for r in comp_results[:3]]
    print(f"{comp_name:<15} best sensor: {top['sensor']:<6} r={top['r']:+.3f}  → {strength}")
    print(f"               top 3 sensors: {', '.join(top3)}")

    if abs_r >= 0.30:
        RECOMMENDED_AXES[comp_name] = {
            "y_axis": comp_results[0]["sensor"],
            "z_axis": comp_results[1]["sensor"],
        }

# ── Recommended axis presets ───────────────────────────────────────────────────
print("\n\n" + "=" * 65)
print("RECOMMENDED 3D VISUALIZATION AXIS PRESETS")
print("=" * 65)
print("X axis = time (always — shows temporal evolution within a cycle)\n")

for comp_name, axes in RECOMMENDED_AXES.items():
    print(f"{comp_name}:")
    print(f"  X = time   Y = {axes['y_axis']}   Z = {axes['z_axis']}   Color = {comp_name.lower()}_label")

# ── Mean sensor values per health state ───────────────────────────────────────
print("\n\n" + "=" * 65)
print("MEAN SENSOR VALUES PER HEALTH STATE")
print("(shows the absolute magnitude of change between states)")
print("=" * 65)

for comp_col, score_map in [
    ("cooler_label", HEALTH_SCORES["cooler_label"]),
    ("pump_label",   HEALTH_SCORES["pump_label"]),
]:
    comp_name = comp_col.replace("_label", "").upper()
    states    = list(score_map.keys())
    top_sens  = [r["sensor"] + "_mean" for r in results[comp_name][:4]]

    print(f"\n{comp_name}")
    header = f"  {'Sensor':<12}" + "".join(f"{s:>20}" for s in states) + f"  {'Δ (max-min)':>12}"
    print(header)
    print("  " + "-" * (12 + 20 * len(states) + 14))

    for col in top_sens:
        name = col.replace("_mean", "")
        means = [df[df[comp_col] == s][col].mean() for s in states]
        delta = max(means) - min(means)
        row   = f"  {name:<12}" + "".join(f"{m:>20.2f}" for m in means) + f"  {delta:>12.2f}"
        print(row)

# ── Visualisation: correlation heatmap ────────────────────────────────────────
print("\n\nGenerating correlation heatmap...")

fig, axes_plot = plt.subplots(1, 5, figsize=(18, 7))
fig.suptitle(
    "Pearson Correlation: Sensor Mean vs Component Health Score\n"
    "Bachelor Thesis — Sofiia-Khrystyna Borysiuk",
    fontsize=13, fontweight="bold", y=1.01
)

comp_order   = ["COOLER", "VALVE", "PUMP", "ACCUMULATOR", "STABLE"]
colors_pos   = plt.cm.RdYlGn   # green=positive (sensor rises with health)
colors_neg   = plt.cm.RdYlGn   # same colormap, negative flipped

for ax, comp_name in zip(axes_plot, comp_order):
    comp_results = results[comp_name]
    sensors_plot = [r["sensor"] for r in comp_results]
    r_values     = [r["r"]      for r in comp_results]
    sigs         = [r["sig"]    for r in comp_results]

    # Color bars by r value: green=positive (good), red=negative (inverse)
    bar_colors = ["#4ade80" if r >= 0 else "#f87171" for r in r_values]

    bars = ax.barh(range(len(sensors_plot)), r_values,
                   color=bar_colors, edgecolor="none", height=0.65)

    # Significance stars on bars
    for i, (r_val, sig) in enumerate(zip(r_values, sigs)):
        if sig != "n.s.":
            x_pos = r_val + (0.01 if r_val >= 0 else -0.01)
            ha    = "left" if r_val >= 0 else "right"
            ax.text(x_pos, i, sig, va="center", ha=ha, fontsize=7, color="#888")

    ax.set_yticks(range(len(sensors_plot)))
    ax.set_yticklabels(sensors_plot, fontsize=9)
    ax.set_xlabel("Pearson r", fontsize=9)
    ax.set_title(comp_name, fontsize=11, fontweight="bold")
    ax.axvline(0, color="#ccc", linewidth=0.8)
    ax.axvline( 0.9, color="#4ade80", linewidth=0.8, linestyle="--", alpha=0.5)
    ax.axvline(-0.9, color="#4ade80", linewidth=0.8, linestyle="--", alpha=0.5)
    ax.axvline( 0.3, color="#fbbf24", linewidth=0.8, linestyle=":",  alpha=0.5)
    ax.axvline(-0.3, color="#fbbf24", linewidth=0.8, linestyle=":",  alpha=0.5)
    ax.set_xlim(-1.05, 1.05)
    ax.invert_yaxis()
    ax.spines[["top", "right"]].set_visible(False)

# Legend
green_patch  = mpatches.Patch(color="#4ade80", label="Positive r (sensor falls as health worsens)")
red_patch    = mpatches.Patch(color="#f87171", label="Negative r (sensor rises as health worsens)")
fig.legend(
    handles=[green_patch, red_patch],
    loc="lower center", ncol=2, fontsize=9,
    bbox_to_anchor=(0.5, -0.04)
)

plt.tight_layout()
out_path = "correlation_heatmap.png"
plt.savefig(out_path, dpi=150, bbox_inches="tight")
print(f"Heatmap saved to: {out_path}")
plt.close()

print("\nDone. Use correlation_heatmap.png in your thesis appendix.")
print("Cite as: Pearson (1895), Cohen (1988) for threshold conventions.")
