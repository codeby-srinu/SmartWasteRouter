import csv


def linear_regression(x, y):

    n = len(x)

    x_mean = sum(x) / n
    y_mean = sum(y) / n

    numerator = 0
    denominator = 0

    for i in range(n):

        numerator += (
            (x[i] - x_mean) *
            (y[i] - y_mean)
        )

        denominator += (
            (x[i] - x_mean) ** 2
        )

    slope = numerator / denominator

    intercept = y_mean - slope * x_mean

    return slope, intercept


# Historical days
x = [1, 2, 3, 4, 5]

results = []


with open("bin_data.csv", "r") as file:

    reader = csv.DictReader(file)

    for row in reader:

        bin_id = row["bin_id"]

        current_fill = float(
            row["current_fill"]
        )

        y = [
            float(row["day1"]),
            float(row["day2"]),
            float(row["day3"]),
            float(row["day4"]),
            float(row["day5"])
        ]

        slope, intercept = linear_regression(
            x,
            y
        )

        predicted_fill = (
            slope * 6 + intercept
        )

        predicted_fill = max(
            0,
            min(100, predicted_fill)
        )

        results.append({
            "id": bin_id,
            "current": current_fill,
            "predicted": round(
                predicted_fill,
                2
            )
        })


# Save predictions

with open(
    "predictions.csv",
    "w",
    newline=""
) as file:

    writer = csv.writer(file)

    writer.writerow([
        "bin_id",
        "current_fill",
        "predicted_fill"
    ])

    for item in results:

        writer.writerow([
            item["id"],
            item["current"],
            item["predicted"]
        ])


print("Python prediction completed.")

for item in results:

    print(
        item["id"],
        "Current:",
        item["current"],
        "%",
        "Predicted:",
        item["predicted"],
        "%"
    )