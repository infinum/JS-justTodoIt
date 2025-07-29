import { registerProvider, ProviderScope } from "@tsed/di";
import { DataSource } from "typeorm";
import { dataSourceOptions } from "../../data-source";
import { Logger } from "@tsed/common";

export const DEFAULT_CONNECTION = Symbol.for("DEFAULT_CONNECTION");
export type DEFAULT_CONNECTION = DataSource;

registerProvider<DataSource>({
  provide: DEFAULT_CONNECTION,
  type: "typeorm:datasource",
  scope: ProviderScope.SINGLETON,
  deps: [Logger],
  async useAsyncFactory(logger: Logger) {
    const ds = new DataSource(dataSourceOptions);
    await ds.initialize();
    logger.info("🗄  SQLite initialized via TypeORM DataSource");
    return ds;
  },
  hooks: {
    $onDestroy(ds) {
      return ds.isInitialized ? ds.destroy() : undefined;
    },
  },
});
