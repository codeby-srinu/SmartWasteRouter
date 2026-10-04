package backend;

import java.util.*;

public class AStar {

    private Graph graph;

    private Map<String, Double> heuristic;

    public AStar(
            Graph graph,
            Map<String, Double> heuristic) {

        this.graph = graph;
        this.heuristic = heuristic;
    }

    private static class Node {

        String location;
        double g;
        double f;

        Node(
                String location,
                double g,
                double f) {

            this.location = location;
            this.g = g;
            this.f = f;
        }
    }

    public List<String> findPath(
            String start,
            String goal) {

        PriorityQueue<Node> open =
            new PriorityQueue<>(
                Comparator.comparingDouble(
                    n -> n.f
                )
            );

        Map<String, Double> cost =
            new HashMap<>();

        Map<String, String> parent =
            new HashMap<>();

        cost.put(start, 0.0);

        open.add(
            new Node(
                start,
                0,
                heuristic.getOrDefault(
                    start,
                    0.0
                )
            )
        );

        while (!open.isEmpty()) {

            Node current =
                open.poll();

            if (
                current.location.equals(goal)
            ) {

                return buildPath(
                    parent,
                    start,
                    goal
                );
            }

            for (
                Graph.Edge edge :
                graph.getNeighbors(
                    current.location
                )
            ) {

                double newCost =
                    cost.get(
                        current.location
                    )
                    + edge.distance;

                if (
                    !cost.containsKey(
                        edge.destination
                    )
                    ||
                    newCost <
                    cost.get(
                        edge.destination
                    )
                ) {

                    cost.put(
                        edge.destination,
                        newCost
                    );

                    parent.put(
                        edge.destination,
                        current.location
                    );

                    double h =
                        heuristic.getOrDefault(
                            edge.destination,
                            0.0
                        );

                    double f =
                        newCost + h;

                    open.add(
                        new Node(
                            edge.destination,
                            newCost,
                            f
                        )
                    );
                }
            }
        }

        return new ArrayList<>();
    }

    private List<String> buildPath(
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

            current = parent.get(current);
        }

        Collections.reverse(path);

        return path;
    }
}