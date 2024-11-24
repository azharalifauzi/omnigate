import { is, sql, type AnyColumn, type SQL } from 'drizzle-orm'
import { PgTimestampString, type SelectedFields } from 'drizzle-orm/pg-core'
import { type SelectResultFields } from 'drizzle-orm/query-builders/select.types'

export function jsonBuildObject<T extends SelectedFields>(
  shape: T,
): SQL<SelectResultFields<T>> {
  const chunks: SQL[] = Object.entries(shape).flatMap(([key, value], index) => {
    const keyValueChunk = [
      sql.raw(`'${key}',`),
      is(value, PgTimestampString)
        ? sql`timezone('UTC', ${value})`
        : sql`${value}`,
    ]
    return index > 0 ? [sql.raw(','), ...keyValueChunk] : keyValueChunk
  })

  return sql`coalesce(json_build_object(${sql.join(chunks)}), '{}')`
}

export function jsonAggBuildObject<
  T extends SelectedFields,
  Column extends AnyColumn,
>(
  shape: T,
  options?: { orderBy?: { colName: Column; direction: 'ASC' | 'DESC' } },
): SQL<SelectResultFields<T>[]> {
  const orderByClause = options?.orderBy
    ? sql`order by ${options.orderBy.colName} ${sql.raw(
        options.orderBy.direction,
      )}`
    : sql``
  return sql`coalesce(jsonb_agg(${jsonBuildObject(
    shape,
  )} ${orderByClause}), '[]'::jsonb)`
}

export function jsonAggBuildObjectOrEmptyArray<T extends SelectedFields, Table>(
  table: Table,
  shape: T,
): SQL<SelectResultFields<T>[]> {
  return sql`
    CASE
      WHEN COUNT(${table}) = 0 THEN '[]'::jsonb
      ELSE jsonb_agg(${jsonBuildObject(shape)})
    END
  `
}
