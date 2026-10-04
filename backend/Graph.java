package backend;

import java.util.*;

public class Graph {

    private Map<String, List<Edge>> graph;

    public Graph() {

        graph = new HashMap<>();
    }

    public void addRoad(
            String from,
            String to,
            double distance) {

        graph
            .computeIfAbsent(
                from,
                k -> new ArrayList<>()
            )
            .add(
                new Edge(
                    to,
                    distance
                )
            );

        graph
            .computeIfAbsent(
                to,
                k -> new ArrayList<>()
            )
            .add(
                new Edge(
                    from,
                    distance
                )
            );
    }

    public List<Edge> getNeighbors(
            String node) {

        return graph.getOrDefault(
            node,
            new ArrayList<>()
        );
    }

    public static class Edge {

        String destination;
        double distance;

        public Edge(
                String destination,
                double distance) {

            this.destination = destination;
            this.distance = distance;
        }
    }
}