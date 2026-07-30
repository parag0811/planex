export type ComplexityLevel = "LOW" | "MEDIUM" | "HIGH" | "VERY HIGH";

export interface ScopeComplexity {
  score: number;
  level: ComplexityLevel;
  reqCount: number;
  featureCount: number;
  mustHaveCount: number;
  niceToHaveCount: number;
  techCount: number;
  techCategories: string[];
}

export interface DbComplexity {
  score: number;
  level: ComplexityLevel;
  entityCount: number;
  fieldCount: number;
  relationCount: number;
  manyToManyCount: number;
  indexCount: number;
  complexFieldTypesCount: number;
  hasSchema: boolean;
}

export interface ApiComplexity {
  score: number;
  level: ComplexityLevel;
  endpointCount: number;
  writeEndpointCount: number;
  authRequiredCount: number;
  realtimeCount: number;
  authType: string;
  hasRoutes: boolean;
}

export interface FolderComplexity {
  score: number;
  level: ComplexityLevel;
  fileCount: number;
  folderCount: number;
  maxDepth: number;
  hasStructure: boolean;
}

export interface RiskFactor {
  id: string;
  title: string;
  description: string;
  severity: "info" | "warning" | "high";
  category: "idea" | "database" | "api" | "folder";
}

export interface ProjectComplexityResult {
  overallScore: number;
  overallLevel: ComplexityLevel;
  color: string;
  estimatedTimeline: string;
  recommendedTeam: string;
  scope: ScopeComplexity;
  database: DbComplexity;
  api: ApiComplexity;
  folder: FolderComplexity;
  riskFactors: RiskFactor[];
  sectionsConfiguredCount: number;
}

function getLevel(score: number): ComplexityLevel {
  if (score < 30) return "LOW";
  if (score < 60) return "MEDIUM";
  if (score < 80) return "HIGH";
  return "VERY HIGH";
}

function getColor(level: ComplexityLevel): string {
  switch (level) {
    case "LOW":
      return "#34d399"; // emerald
    case "MEDIUM":
      return "#f59e0b"; // amber
    case "HIGH":
      return "#d84c28"; // accent orange
    case "VERY HIGH":
      return "#ec4899"; // rose pink
  }
}

export function calculateProjectComplexity(sectionsMap: {
  idea?: any;
  database?: any;
  api?: any;
  folder?: any;
}): ProjectComplexityResult {
  const ideaContent = sectionsMap.idea;
  const dbContent = sectionsMap.database;
  const apiContent = sectionsMap.api;
  const folderContent = sectionsMap.folder;

  let sectionsConfiguredCount = 0;

  // 1. SCOPE / REQUIREMENTS (IDEA)
  const reqs: string[] = Array.isArray(ideaContent?.requirements)
    ? ideaContent.requirements
    : [];
  const keyFeatures: any[] = Array.isArray(ideaContent?.key_features)
    ? ideaContent.key_features
    : [];
  const mustHaveCount = keyFeatures.filter(
    (f) => f.priority === "must_have" || f.priority === "must-have",
  ).length;
  const niceToHaveCount = keyFeatures.length - mustHaveCount;

  const stack = ideaContent?.suggested_tech_stack || {};
  let techCount = 0;
  const techCategories: string[] = [];
  ["frontend", "backend", "database", "infrastructure", "ai", "frameworks"].forEach(
    (cat) => {
      if (Array.isArray(stack[cat]) && stack[cat].length > 0) {
        techCount += stack[cat].length;
        techCategories.push(cat);
      }
    },
  );

  const reqScore = Math.min(30, reqs.length * 6);
  const featScore = Math.min(35, mustHaveCount * 6 + niceToHaveCount * 3);
  const techScore = Math.min(25, techCount * 4);
  const aiScoreBonus =
    ideaContent?.estimated_complexity === "high"
      ? 10
      : ideaContent?.estimated_complexity === "medium"
        ? 5
        : 0;

  let scopeScore = Math.min(100, reqScore + featScore + techScore + aiScoreBonus);

  if (reqs.length > 0 || keyFeatures.length > 0 || ideaContent?.overview) {
    sectionsConfiguredCount++;
  } else {
    scopeScore = 0;
  }

  const scope: ScopeComplexity = {
    score: scopeScore,
    level: getLevel(scopeScore),
    reqCount: reqs.length,
    featureCount: keyFeatures.length,
    mustHaveCount,
    niceToHaveCount,
    techCount,
    techCategories,
  };

  // 2. DATABASE (DB)
  const entities: any[] = Array.isArray(dbContent?.entities)
    ? dbContent.entities
    : [];
  const relations: any[] = Array.isArray(dbContent?.relationships)
    ? dbContent.relationships
    : [];
  const indexes: any[] = Array.isArray(dbContent?.indexes)
    ? dbContent.indexes
    : [];

  let totalFields = 0;
  let complexFieldTypesCount = 0;
  entities.forEach((ent) => {
    if (Array.isArray(ent.fields)) {
      totalFields += ent.fields.length;
      ent.fields.forEach((f: any) => {
        const t = (f.type || "").toLowerCase();
        if (["json", "enum", "timestamp", "decimal", "float"].includes(t)) {
          complexFieldTypesCount++;
        }
      });
    }
  });

  const manyToManyCount = relations.filter(
    (r) => r.type === "many-to-many",
  ).length;

  let dbScore = 0;
  const hasSchema = entities.length > 0;
  if (hasSchema) {
    sectionsConfiguredCount++;
    const entScore = Math.min(35, entities.length * 9);
    const fldScore = Math.min(30, totalFields * 1.5);
    const relScore = Math.min(20, relations.length * 6);
    const m2mScore = manyToManyCount * 5;
    const idxScore = Math.min(10, indexes.length * 3 + complexFieldTypesCount * 2);
    dbScore = Math.min(100, Math.round(entScore + fldScore + relScore + m2mScore + idxScore));
  }

  const database: DbComplexity = {
    score: dbScore,
    level: getLevel(dbScore),
    entityCount: entities.length,
    fieldCount: totalFields,
    relationCount: relations.length,
    manyToManyCount,
    indexCount: indexes.length,
    complexFieldTypesCount,
    hasSchema,
  };

  // 3. API
  const restRoutes: any[] = Array.isArray(apiContent?.rest)
    ? apiContent.rest
    : [];
  const realtimeEvents: any[] = Array.isArray(apiContent?.realtime)
    ? apiContent.realtime
    : [];
  const authFlow = apiContent?.auth || {};

  const writeEndpointCount = restRoutes.filter((r) =>
    ["POST", "PUT", "PATCH", "DELETE"].includes((r.method || "").toUpperCase()),
  ).length;
  const authRequiredCount = restRoutes.filter((r) => r.authRequired).length;
  const authType = authFlow.type || "None";

  let apiScore = 0;
  const hasRoutes = restRoutes.length > 0 || realtimeEvents.length > 0;
  if (hasRoutes) {
    sectionsConfiguredCount++;
    const epScore = Math.min(40, restRoutes.length * 5);
    const writeScore = Math.min(15, writeEndpointCount * 3);
    const realtimeScore = Math.min(25, realtimeEvents.length * 7);
    const authScoreBonus =
      authType === "OAuth" ? 15 : authType === "JWT" ? 10 : authType === "Session" ? 8 : 0;
    apiScore = Math.min(100, Math.round(epScore + writeScore + realtimeScore + authScoreBonus));
  }

  const api: ApiComplexity = {
    score: apiScore,
    level: getLevel(apiScore),
    endpointCount: restRoutes.length,
    writeEndpointCount,
    authRequiredCount,
    realtimeCount: realtimeEvents.length,
    authType,
    hasRoutes,
  };

  // 4. FOLDER STRUCTURE
  const rootNodes: any[] = Array.isArray(folderContent?.root)
    ? folderContent.root
    : [];

  let fileCount = 0;
  let folderCount = 0;
  let maxDepth = 0;

  function walk(nodes: any[], currentDepth: number) {
    if (!Array.isArray(nodes)) return;
    if (currentDepth > maxDepth) maxDepth = currentDepth;
    nodes.forEach((n) => {
      if (n.type === "file") {
        fileCount++;
      } else if (n.type === "folder") {
        folderCount++;
        if (Array.isArray(n.children)) {
          walk(n.children, currentDepth + 1);
        }
      }
    });
  }

  walk(rootNodes, 1);

  let folderScore = 0;
  const hasStructure = rootNodes.length > 0;
  if (hasStructure) {
    sectionsConfiguredCount++;
    const fileScore = Math.min(40, fileCount * 2.5);
    const fldScore = Math.min(35, folderCount * 3.5);
    const depthScore = Math.min(25, Math.max(0, maxDepth - 2) * 8);
    folderScore = Math.min(100, Math.round(fileScore + fldScore + depthScore));
  }

  const folder: FolderComplexity = {
    score: folderScore,
    level: getLevel(folderScore),
    fileCount,
    folderCount,
    maxDepth,
    hasStructure,
  };

  // 5. OVERALL SCORE & LEVEL
  // Weighted: Scope 25%, Database 30%, API 30%, Folder 15%
  const overallScore = Math.round(
    scope.score * 0.25 + database.score * 0.3 + api.score * 0.3 + folder.score * 0.15,
  );
  const overallLevel = getLevel(overallScore);
  const color = getColor(overallLevel);

  // Timeline & Team estimation
  let estimatedTimeline = "1 - 2 Weeks";
  let recommendedTeam = "1 Developer";
  if (overallScore >= 80) {
    estimatedTimeline = "10+ Weeks";
    recommendedTeam = "4 - 6 Developers";
  } else if (overallScore >= 60) {
    estimatedTimeline = "6 - 10 Weeks";
    recommendedTeam = "3 - 4 Developers";
  } else if (overallScore >= 30) {
    estimatedTimeline = "3 - 6 Weeks";
    recommendedTeam = "2 - 3 Developers";
  }

  // 6. RISK FACTORS
  const riskFactors: RiskFactor[] = [];

  if (database.relationCount >= 6) {
    riskFactors.push({
      id: "high-db-coupling",
      title: "High Database Coupling",
      description: `${database.relationCount} relationships defined across entities. Requires strict schema foreign key constraints & cascading rules.`,
      severity: "warning",
      category: "database",
    });
  }

  if (database.manyToManyCount >= 2) {
    riskFactors.push({
      id: "many-to-many-joins",
      title: "Many-to-Many Join Tables",
      description: `${database.manyToManyCount} N:M relationships require intermediate join models and index optimization.`,
      severity: "warning",
      category: "database",
    });
  }

  if (api.realtimeCount > 0) {
    riskFactors.push({
      id: "realtime-websocket",
      title: "Real-time Event Handlers",
      description: `${api.realtimeCount} WebSocket event stream(s) specified. Requires persistent socket connection manager & room pub/sub logic.`,
      severity: "info",
      category: "api",
    });
  }

  if (api.endpointCount >= 15) {
    riskFactors.push({
      id: "large-api-surface",
      title: "Extensive API Surface",
      description: `${api.endpointCount} REST endpoints configured. Comprehensive validation middleware & API docs needed.`,
      severity: "info",
      category: "api",
    });
  }

  if (scope.reqCount >= 10 || scope.mustHaveCount >= 7) {
    riskFactors.push({
      id: "dense-requirements",
      title: "Broad Requirement Scope",
      description: `${scope.reqCount} functional requirements and ${scope.mustHaveCount} must-have features. Consider phased release milestones.`,
      severity: "info",
      category: "idea",
    });
  }

  if (folder.maxDepth >= 5) {
    riskFactors.push({
      id: "deep-folder-nesting",
      title: "Deep Directory Tree",
      description: `Folder structure depth reaches level ${folder.maxDepth}. Keep component imports modular with path aliases.`,
      severity: "warning",
      category: "folder",
    });
  }

  if (!database.hasSchema) {
    riskFactors.push({
      id: "missing-db",
      title: "Database Schema Unconfigured",
      description: "No entities or fields have been added yet to the Database section.",
      severity: "info",
      category: "database",
    });
  }

  if (!api.hasRoutes) {
    riskFactors.push({
      id: "missing-api",
      title: "API Specification Unconfigured",
      description: "No API routes or WebSocket events configured in the API section.",
      severity: "info",
      category: "api",
    });
  }

  if (!folder.hasStructure) {
    riskFactors.push({
      id: "missing-folder",
      title: "Folder Tree Unconfigured",
      description: "No folder tree structure initialized in the Folder section.",
      severity: "info",
      category: "folder",
    });
  }

  return {
    overallScore,
    overallLevel,
    color,
    estimatedTimeline,
    recommendedTeam,
    scope,
    database,
    api,
    folder,
    riskFactors,
    sectionsConfiguredCount,
  };
}
