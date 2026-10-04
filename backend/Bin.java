package backend;

public class Bin {

    private String id;
    private double currentFill;
    private double predictedFill;

    public Bin(
            String id,
            double currentFill,
            double predictedFill) {

        this.id = id;
        this.currentFill = currentFill;
        this.predictedFill = predictedFill;
    }

    public String getId() {
        return id;
    }

    public double getCurrentFill() {
        return currentFill;
    }

    public double getPredictedFill() {
        return predictedFill;
    }

    @Override
    public String toString() {

        return id +
                " | Current: " +
                currentFill +
                "% | Predicted: " +
                predictedFill +
                "%";
    }
}