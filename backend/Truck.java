package backend;

public class Truck {

    private String id;
    private double capacity;
    private double load;

    public Truck(
            String id,
            double capacity) {

        this.id = id;
        this.capacity = capacity;
        this.load = 0;
    }

    public String getId() {
        return id;
    }

    public double getCapacity() {
        return capacity;
    }

    public double getLoad() {
        return load;
    }

    public boolean canCollect(
            double amount) {

        return load + amount <= capacity;
    }

    public void collect(
            double amount) {

        if (canCollect(amount)) {

            load += amount;

        } else {

            System.out.println(
                "Truck capacity exceeded."
            );
        }
    }
}