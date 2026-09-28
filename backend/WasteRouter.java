package backend;

import java.io.*;
import java.util.*;

public class WasteRouter {

    // ==========================================
    // BIN CLASS
    // ==========================================

    static class Bin {

        String id;
        double currentFill;
        double predictedFill;

        Bin(String id, double currentFill, double predictedFill) {

            this.id = id;
            this.currentFill = currentFill;
            this.predictedFill = predictedFill;
        }
    }


    // ==========================================
    // TRUCK CLASS
    // ==========================================

    static class Truck {

        String id;
        int capacity;

        Truck(String id, int capacity) {

            this.id = id;
            this.capacity = capacity;
        }
    }


    // ==========================================
    // EDGE CLASS
    // Represents a road between two locations
    // ==========================================

    static class Edge {

        String destination;
        double distance;

        Edge(String destination, double distance) {

            this.destination = destination;
            this.distance = distance;
        }
    }


    // ==========================================
    // A* NODE
    // ==========================================

    static class AStarNode {

        String location;
        double cost;
        double priority;

        AStarNode(
                String location,
                double cost,
                double priority) {

            this.location = location;
            this.cost = cost;
            this.priority = priority;
        }
    }


    // ==========================================
    // GRAPH
    // ==========================================

    static Map<String, List<Edge>> graph =
            new HashMap<>();


    // ==========================================
    // ADD ROAD
    // ==========================================

    static void addRoad(
            String from,
            String to,
            double distance) {

        graph
                .computeIfAbsent(
                        from,
                        k -> new ArrayList<>()
                )
                .add(
                        new Edge(to, distance)
                );

        graph
                .computeIfAbsent(
                        to,
                        k -> new ArrayList<>()
                )
                .add(
                        new Edge(from, distance)
                );
    }


    // ==========================================
    // READ PYTHON PREDICTIONS
    // ==========================================

    static PriorityQueue<Bin> readPredictions()
            throws Exception {

        PriorityQueue<Bin> heap =
                new PriorityQueue<>(
                        (a, b) ->
                                Double.compare(
                                        b.predictedFill,
                                        a.predictedFill
                                )
                );


        BufferedReader reader =
        new BufferedReader(
                new FileReader(
                        "backend/predictions.csv"
                )
        );

        // Skip header

        reader.readLine();

        String line;


        while ((line = reader.readLine()) != null) {

            String[] data = line.split(",");


            String id = data[0];

            double currentFill =
                    Double.parseDouble(data[1]);

            double predictedFill =
                    Double.parseDouble(data[2]);


            Bin bin =
                    new Bin(
                            id,
                            currentFill,
                            predictedFill
                    );


            heap.add(bin);
        }


        reader.close();


        return heap;
    }


    // ==========================================
    // A* ALGORITHM
    // ==========================================

    static List<String> aStar(
            String start,
            String goal) {


        PriorityQueue<AStarNode> open =
                new PriorityQueue<>(
                        Comparator.comparingDouble(
                                node -> node.priority
                        )
                );


        Map<String, Double> cost =
                new HashMap<>();


        Map<String, String> parent =
                new HashMap<>();


        for (String node : graph.keySet()) {

            cost.put(
                    node,
                    Double.POSITIVE_INFINITY
            );
        }


        cost.put(start, 0.0);


        open.add(
                new AStarNode(
                        start,
                        0,
                        0
                )
        );


        while (!open.isEmpty()) {

            AStarNode current =
                    open.poll();


            if (current.location.equals(goal)) {

                return buildPath(
                        parent,
                        start,
                        goal
                );
            }


            for (Edge edge :
                    graph.getOrDefault(
                            current.location,
                            new ArrayList<>()
                    )) {


                double newCost =
                        cost.get(
                                current.location
                        )
                        + edge.distance;


                if (newCost <
                        cost.get(
                                edge.destination
                        )) {


                    cost.put(
                            edge.destination,
                            newCost
                    );


                    parent.put(
                            edge.destination,
                            current.location
                    );


                    open.add(
                            new AStarNode(
                                    edge.destination,
                                    newCost,
                                    newCost
                            )
                    );
                }
            }
        }


        return new ArrayList<>();
    }


    // ==========================================
    // BUILD PATH
    // ==========================================

    static List<String> buildPath(
            Map<String, String> parent,
            String start,
            String goal) {


        List<String> path =
                new ArrayList<>();


        String current = goal;


        while (current != null) {

            path.add(current);


            if (current.equals(start)) {

                break;
            }


            current =
                    parent.get(current);
        }


        Collections.reverse(path);


        return path;
    }


    // ==========================================
    // MAIN
    // ==========================================

    public static void main(String[] args)
            throws Exception {


        System.out.println();
        System.out.println(
                "=========================================="
        );

        System.out.println(
                "     SMART WASTE COLLECTION ROUTER"
        );

        System.out.println(
                "=========================================="
        );


        // ======================================
        // CREATE ROAD NETWORK
        // ======================================

        addRoad("DEPOT", "B1", 4);

        addRoad("DEPOT", "B2", 6);

        addRoad("B1", "B2", 3);

        addRoad("B1", "B3", 5);

        addRoad("B2", "B4", 4);

        addRoad("B3", "B5", 3);

        addRoad("B4", "B5", 6);


        // ======================================
        // CREATE TRUCK
        // ======================================

        Truck truck =
                new Truck(
                        "TRUCK-01",
                        100
                );


        System.out.println();

        System.out.println(
                "Truck: " + truck.id
        );

        System.out.println(
                "Capacity: " +
                truck.capacity +
                "%"
        );


        // ======================================
        // READ PYTHON DATA
        // ======================================

        PriorityQueue<Bin> heap =
                readPredictions();


        // ======================================
        // DISPLAY BIN STATUS
        // ======================================

        System.out.println();

        System.out.println(
                "------------------------------------------"
        );

        System.out.println(
                "             BIN PRIORITY"
        );

        System.out.println(
                "------------------------------------------"
        );


        PriorityQueue<Bin> copy =
                new PriorityQueue<>(heap);


        while (!copy.isEmpty()) {

            Bin bin = copy.poll();


            String status;


            if (bin.predictedFill >= 80) {

                status = "URGENT";

            } else if (bin.predictedFill >= 60) {

                status = "HIGH";

            } else {

                status = "LOW";
            }


            System.out.printf(
                    "%s   Current: %.1f%%   Predicted: %.1f%%   [%s]%n",
                    bin.id,
                    bin.currentFill,
                    bin.predictedFill,
                    status
            );
        }


        // ======================================
        // CREATE COLLECTION ROUTE
        // ======================================

        System.out.println();

        System.out.println(
                "------------------------------------------"
        );

        System.out.println(
                "             COLLECTION ROUTE"
        );

        System.out.println(
                "------------------------------------------"
        );


        String currentLocation =
                "DEPOT";


        int binsCollected = 0;


        while (!heap.isEmpty()) {

            Bin bin = heap.poll();


            // Collect only bins
            // predicted above 70%

            if (bin.predictedFill < 70) {

                continue;
            }


            List<String> route =
                    aStar(
                            currentLocation,
                            bin.id
                    );


            System.out.println();


            System.out.println(
                    "Collecting: " +
                    bin.id
            );


            System.out.println(
                    "Predicted fill: " +
                    bin.predictedFill +
                    "%"
            );


            System.out.println(
                    "Route: " +
                    String.join(
                            " -> ",
                            route
                    )
            );


            currentLocation =
                    bin.id;


            binsCollected++;
        }


        // ======================================
        // RETURN TO DEPOT
        // ======================================

        List<String> returnRoute =
                aStar(
                        currentLocation,
                        "DEPOT"
                );


        System.out.println();


        System.out.println(
                "Return to depot:"
        );


        System.out.println(
                String.join(
                        " -> ",
                        returnRoute
                )
        );


        // ======================================
        // FINAL RESULT
        // ======================================

        System.out.println();

        System.out.println(
                "=========================================="
        );

        System.out.println(
                "             FINAL RESULT"
        );

        System.out.println(
                "=========================================="
        );


        System.out.println(
                "Truck: " +
                truck.id
        );


        System.out.println(
                "Bins collected: " +
                binsCollected
        );


        System.out.println(
                "Status: ROUTE COMPLETED"
        );


        System.out.println(
                "=========================================="
        );
    }
}