const publishingRoles = new Set(["admin", "publisher"]);
const reviewingRoles = new Set(["admin", "publisher", "editor"]);

export function canPublish(role) {
  return publishingRoles.has(role);
}

export function canManageAgencyMetadata(role) {
  return reviewingRoles.has(role);
}

export function canAccessArticle(role, userId, article) {
  if (role !== "reporter") return true;
  return Number(article?.assignedTo) === Number(userId);
}

export function canEditArticle(role, userId, article) {
  if (role === "viewer") return false;
  if (publishingRoles.has(role)) return true;
  if (["published", "scheduled"].includes(article?.status) || ["published", "approved"].includes(article?.workflowState)) return false;
  if (role === "editor") return true;
  return role === "reporter" && canAccessArticle(role, userId, article);
}

export function canWriteStatus(role, status) {
  return ["published", "scheduled"].includes(status) ? publishingRoles.has(role) : role !== "viewer";
}
