import csv

# -----------------------------
# Simple Linear Regression
# -----------------------------

def linear_regression(x, y):
    n = len(x)

    x_mean = sum(x) / n
    y_mean = sum(y) / n

    numerator = 0
    denominator = 0

    for i in range(n):
        numerator += (x[i] - x_mean) * (y[i] - y_mean)
        denominator += (x[i] - x_mean) ** 2

    slope = numerator / denominator

    intercept = y_mean - slope * x_mean

    return slope, intercept


# -----------------------------
# Read CSV
# -----------------------------

input_file = "bin_data.csv"
output_file = "predictions.csv"

with open(input_file, "r") as file:

    reader = csv.DictReader(file)

    rows = list(reader)


# Days 1 to 5

x = [1, 2, 3, 4, 5]

predictions = []


# -----------------------------
# Predict each bin
# -----------------------------

for row in rows:

    bin_id = row["bin_id"]

    y = [
        float(row["day1"]),
        float(row["day2"]),
        float(row["day3"]),
        float(row["day4"]),
        float(row["day5"])
    ]

    current_fill = float(row["current_fill"])

    slope, intercept = linear_regression(x, y)

    # Predict day 6

    predicted_fill = slope * 6 + intercept

    # Keep value between 0 and 100

    predicted_fill = max(0, min(100, predicted_fill))

    predictions.append({
        "bin_id": bin_id,
        "current_fill": current_fill,
        "predicted_fill": round(predicted_fill, 2)
    })


# -----------------------------
# Save predictions
# -----------------------------

with open(output_file, "w", newline="") as file:

    fieldnames = [
        "bin_id",
        "current_fill",
        "predicted_fill"
    ]

    writer = csv.DictWriter(
        file,
        fieldnames=fieldnames
    )

    writer.writeheader()

    writer.writerows(predictions)


# -----------------------------
# Display result
# -----------------------------

print()
print("======================================")
print("      WASTE FILL PREDICTION")
print("======================================")

for item in predictions:

    print(
        item["bin_id"],
        "Current:",
        item["current_fill"],
        "%",
        "Predicted:",
        item["predicted_fill"],
        "%"
    )

print()
print("Prediction completed.")
print("Created: predictions.csv")