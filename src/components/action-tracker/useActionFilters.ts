import { useState, useCallback } from "react";
import type { Action, UserListItem } from "./types";

/**
 * Hook that manages filter state and provides filtered/sorted action lists.
 * Extracted from ActionTracker to separate filtering logic from UI.
 */
export function useActionFilters(
  actions: Action[],
  users: UserListItem[],
) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [disciplineFilter, setDisciplineFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");

  const getFilteredActionsForCategory = useCallback(
    (plant: string, category: string): Action[] => {
      let filtered = actions.filter((a) => a.plant === plant);

      if (category === "allgemein") {
        filtered = filtered.filter(
          (a) => !a.category || a.category === "ALLGEMEIN",
        );
      } else if (category === "rigmoves") {
        filtered = filtered.filter((a) => a.category === "RIGMOVE");
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (a) =>
            a.title?.toLowerCase().includes(query) ||
            a.description?.toLowerCase().includes(query) ||
            a.assignedTo?.toLowerCase().includes(query),
        );
      }

      if (statusFilter !== "all") {
        filtered = filtered.filter((a) => a.status === statusFilter);
      }
      if (disciplineFilter !== "all") {
        filtered = filtered.filter((a) => a.discipline === disciplineFilter);
      }
      if (priorityFilter !== "all") {
        filtered = filtered.filter((a) => a.priority === priorityFilter);
      }
      if (userFilter !== "all") {
        filtered = filtered.filter((a) => {
          const user = users.find(
            (u) => `${u.firstName} ${u.lastName}` === userFilter,
          );
          return user ? a.assignedTo === user.email : false;
        });
      }
      if (locationFilter !== "all") {
        filtered = filtered.filter((a) => a.location === locationFilter);
      }

      return filtered.sort((a, b) => {
        if (a.status === "COMPLETED" && b.status !== "COMPLETED") return 1;
        if (a.status !== "COMPLETED" && b.status === "COMPLETED") return -1;
        if (a.status !== "COMPLETED" && b.status !== "COMPLETED") {
          if (!a.dueDate && b.dueDate) return 1;
          if (a.dueDate && !b.dueDate) return -1;
          if (!a.dueDate && !b.dueDate) return 0;
          return (
            new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
          );
        }
        return 0;
      });
    },
    [
      actions,
      users,
      searchQuery,
      statusFilter,
      disciplineFilter,
      priorityFilter,
      userFilter,
      locationFilter,
    ],
  );

  const getActionStats = useCallback(
    (plant: string) => {
      const plantActions = actions.filter((a) => a.plant === plant);
      return {
        total: plantActions.length,
        open: plantActions.filter((a) => a.status === "OPEN").length,
        inProgress: plantActions.filter((a) => a.status === "IN_PROGRESS")
          .length,
        completed: plantActions.filter((a) => a.status === "COMPLETED").length,
      };
    },
    [actions],
  );

  const getCategoryStats = useCallback(
    (plant: string, category: string) => {
      return getFilteredActionsForCategory(plant, category).length;
    },
    [getFilteredActionsForCategory],
  );

  return {
    // State
    searchQuery,
    statusFilter,
    disciplineFilter,
    priorityFilter,
    userFilter,
    locationFilter,
    // Setters
    setSearchQuery,
    setStatusFilter,
    setDisciplineFilter,
    setPriorityFilter,
    setUserFilter,
    setLocationFilter,
    // Computed
    getFilteredActionsForCategory,
    getActionStats,
    getCategoryStats,
  };
}
