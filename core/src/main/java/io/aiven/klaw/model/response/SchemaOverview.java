package io.aiven.klaw.model.response;

import java.util.List;
import java.util.Map;
import lombok.Data;

@Data
public class SchemaOverview extends ResourceOverviewAttributes {
  Map<String, List<Integer>> allSchemaVersions;
  Map<String, Integer> latestVersion;
  Map<String, PromotionStatus> schemaPromotionDetails;
  List<SchemaDetailsPerEnv> schemaDetails;
}
