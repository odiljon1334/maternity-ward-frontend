export type PostScheduleEmployeeView = "ALL" | "PLANNED" | "UNPLANNED" | "OUTSIDE";

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

  if (view !== "ALL") return filtered;
  return filtered
    .map((employee, index) => ({ employee, index }))
    .sort((left, right) => {
      const leftPlanned = plannedEmployeeIds.has(left.employee.id) ? 1 : 0;
      const rightPlanned = plannedEmployeeIds.has(right.employee.id) ? 1 : 0;
      return rightPlanned - leftPlanned || left.index - right.index;
    })
    .map(({ employee }) => employee);
}
