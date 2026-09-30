export type PostScheduleEmployeeView = "ALL" | "PLANNED" | "UNPLANNED" | "OUTSIDE";

export function collectPersistedPlannedEmployeeIds(
  entries: Array<{ employeeId: string }>,
): Set<string> {
  return new Set(entries.map((entry) => entry.employeeId));
}

export function filterAndOrderPostEmployees<T extends { id: string }>(
  employees: T[],
  plannedEmployeeIds: Set<string>,
  outsidePostEmployeeIds: Set<string>,
  view: PostScheduleEmployeeView,
): T[] {
  const filtered = employees.filter((employee) => {
    if (view === "PLANNED") return plannedEmployeeIds.has(employee.id);
    if (view === "UNPLANNED") return !plannedEmployeeIds.has(employee.id);
    if (view === "OUTSIDE") return outsidePostEmployeeIds.has(employee.id);
    return true;
  });

  // Never reorder the editable grid. A row that moves after selecting a shift
  // can make the next click target a different employee. The explicit
  // "Grafik bor" filter is the safe way to surface planned employees.
  return filtered;
}
