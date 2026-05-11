import os
import pandas as pd

RAW_DIR = "data-processing/source-data"
OUTPUT_CSV = "public/hydraulic_data.csv"

SENSORS = [
    "PS1",
    "PS2",
    "PS3",
    "PS4",
    "PS5",
    "PS6",
    "EPS1",
    "FS1",
    "FS2",
    "TS1",
    "TS2",
    "TS3",
    "TS4",
    "VS1",
    "CE",
    "CP",
    "SE",
]

LABEL_NAMES = ["cooler", "valve", "pump", "accumulator", "stable"]

LABEL_INFO = {
    "cooler": {3: "near_failure", 20: "reduced_efficiency", 100: "full_efficiency"},
    "valve": {73: "near_failure", 80: "severe_lag", 90: "small_lag", 100: "optimal"},
    "pump": {0: "no_leakage", 1: "weak_leakage", 2: "severe_leakage"},
    "accumulator": {
        90: "near_failure",
        100: "severely_reduced",
        115: "slightly_reduced",
        130: "optimal",
    },
    "stable": {0: "stable", 1: "unstable"},
}


def load_sensor(name):
    path = os.path.join(RAW_DIR, f"{name}.txt")
    if not os.path.exists(path):
        raise FileNotFoundError(f"Could not find {path}")
    raw = pd.read_csv(path, sep="\t", header=None)
    return pd.DataFrame(
        {
            f"{name}_mean": raw.mean(axis=1),
            f"{name}_std": raw.std(axis=1),
            f"{name}_min": raw.min(axis=1),
            f"{name}_max": raw.max(axis=1),
        }
    )


def load_labels():
    path = os.path.join(RAW_DIR, "profile.txt")
    if not os.path.exists(path):
        raise FileNotFoundError(f"Could not find {path}")
    labels = pd.read_csv(path, sep="\t", header=None, names=LABEL_NAMES)
    for col, mapping in LABEL_INFO.items():
        labels[f"{col}_label"] = labels[col].map(mapping)
    return labels


def build_csv():
    print("Loading and merging sensor files...")
    parts = []
    for name in SENSORS:
        print(f"  -> {name}.txt")
        parts.append(load_sensor(name))

    print("  -> profile.txt (labels)")
    labels = load_labels()

    cycle_index = pd.DataFrame({"cycle": range(1, len(labels) + 1)})
    combined = pd.concat([cycle_index] + parts + [labels], axis=1)

    combined.to_csv(OUTPUT_CSV, index=False)
    print(f"\n✓ Saved: {OUTPUT_CSV}")
    print(f"  Shape: {combined.shape[0]} rows x {combined.shape[1]} columns")
    print(f"\nColumn groups:")
    print(f"  cycle             -- cycle number (1-2205)")
    print(f"  PS1-PS6_*         -- pressure sensors (mean/std/min/max each)")
    print(f"  EPS1_*            -- motor power")
    print(f"  FS1-FS2_*         -- volume flow")
    print(f"  TS1-TS4_*         -- temperature")
    print(f"  VS1_*             -- vibration")
    print(f"  CE, CP, SE_*      -- virtual sensors")
    print(f"  cooler/valve/pump/accumulator -- numeric fault labels")
    print(f"  *_label           -- readable labels e.g. 'near_failure', 'optimal'")
    print(f"\nFirst 3 rows preview:")
    preview_cols = [
        "cycle",
        "PS1_mean",
        "TS1_mean",
        "FS1_mean",
        "cooler_label",
        "valve_label",
        "pump_label",
    ]
    print(combined[preview_cols].head(3).to_string(index=False))


def build_timeseries_csv():
    print("Building time-series dataset...")

    sensor_frames = []

    for name in SENSORS:
        path = os.path.join(RAW_DIR, f"{name}.txt")
        raw = pd.read_csv(path, sep="\t", header=None)

        rows = []
        for cycle_idx, row in raw.iterrows():
            for t, value in enumerate(row):
                rows.append({"cycle": cycle_idx + 1, "time": t, name: value})

        sensor_frames.append(pd.DataFrame(rows))

    # Merge all sensors
    combined = sensor_frames[0]
    for df in sensor_frames[1:]:
        combined = combined.merge(df, on=["cycle", "time"])

    # Add labels (per cycle)
    labels = load_labels()
    combined = combined.merge(labels, left_on="cycle", right_index=True)

    output = "public/hydraulic_timeseries.csv"
    combined.to_csv(output, index=False)

    print(f"Saved: {output}")
    print(f"Shape: {combined.shape}")


if __name__ == "__main__":
    build_csv()
    build_timeseries_csv()
    print("\nDone!")
