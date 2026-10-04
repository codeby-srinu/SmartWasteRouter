package backend;

import java.util.PriorityQueue;

public class FleetManager {

    private PriorityQueue<Bin> bins;

    public FleetManager() {

        bins = new PriorityQueue<>(
            (a, b) ->
                Double.compare(
                    b.getPredictedFill(),
                    a.getPredictedFill()
                )
        );
    }

    public void addBin(Bin bin) {

        bins.add(bin);
    }

    public Bin getNextBin() {

        return bins.poll();
    }

    public boolean hasBins() {

        return !bins.isEmpty();
    }
}