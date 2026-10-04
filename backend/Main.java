package backend;

import java.io.*;
import java.util.*;

public class Main {

    public static void main(
            String[] args)
            throws Exception {

        System.out.println(
            "================================="
        );

        System.out.println(
            " SMART WASTE COLLECTION ROUTER"
        );

        System.out.println(
            "================================="
        );


        // =============================
        // PRIORITY QUEUE
        // =============================

        FleetManager manager =
            new FleetManager();


        // =============================
        // READ PYTHON PREDICTIONS
        // =============================

        BufferedReader reader =
            new BufferedReader(
                new FileReader(
                    "backend/predictions.csv"
                )
            );

        reader.readLine();

        String line;

        while (
            (line = reader.readLine())
            != null
        ) {

            String[] data =
                line.split(",");

            String id = data[0];

            double current =
                Double.parseDouble(data[1]);

            double predicted =
                Double.parseDouble(data[2]);

            manager.addBin(
                new Bin(
                    id,
                    current,
                    predicted
                )
            );
        }

        reader.close();


        // =============================
        // ROAD GRAPH
        // =============================

        Graph graph =
            new Graph();

        graph.addRoad(
            "DEPOT",
            "B1",
            4
        );

        graph.addRoad(
            "DEPOT",
            "B2",
            6
        );

        graph.addRoad(
            "B1",
            "B2",
            3
        );

        graph.addRoad(
            "B1",
            "B3",
            5
        );

        graph.addRoad(
            "B2",
            "B4",
            4
        );

        graph.addRoad(
            "B3",
            "B5",
            3
        );

        graph.addRoad(
            "B4",
            "B5",
            6
        );


        // =============================
        // A* HEURISTIC
        // =============================

        Map<String, Double> heuristic =
            new HashMap<>();

        heuristic.put("DEPOT", 10.0);
        heuristic.put("B1", 7.0);
        heuristic.put("B2", 6.0);
        heuristic.put("B3", 4.0);
        heuristic.put("B4", 4.0);
        heuristic.put("B5", 2.0);


        AStar router =
            new AStar(
                graph,
                heuristic
            );


        // =============================
        // TRUCK
        // =============================

        Truck truck =
            new Truck(
                "TRUCK-01",
                100
            );


        // =============================
        // SELECT URGENT BINS
        // =============================

        List<Bin> selectedBins =
            new ArrayList<>();

        System.out.println(
            "\nBIN PRIORITY"
        );

        System.out.println(
            "---------------------------------"
        );

        while (manager.hasBins()) {

            Bin bin =
                manager.getNextBin();

            System.out.println(bin);

            if (
                bin.getPredictedFill()
                >= 70
            ) {

                selectedBins.add(bin);
            }
        }


        // =============================
        // ROUTE
        // =============================

        System.out.println(
            "\nOPTIMIZED ROUTE"
        );

        System.out.println(
            "---------------------------------"
        );

        String current =
            "DEPOT";

        for (Bin bin : selectedBins) {

            List<String> path =
                router.findPath(
                    current,
                    bin.getId()
                );

            System.out.println(
                String.join(
                    " -> ",
                    path
                )
            );

            current =
                bin.getId();

            truck.collect(
                bin.getPredictedFill()
            );
        }


        // =============================
        // RETURN TO DEPOT
        // =============================

        List<String> returnPath =
            router.findPath(
                current,
                "DEPOT"
            );

        System.out.println(
            "Return: " +
            String.join(
                " -> ",
                returnPath
            )
        );


        System.out.println(
            "\n================================="
        );

        System.out.println(
            "Truck: " +
            truck.getId()
        );

        System.out.println(
            "Bins selected: " +
            selectedBins.size()
        );

        System.out.println(
            "Truck load: " +
            truck.getLoad()
        );

        System.out.println(
            "================================="
        );
    }
}