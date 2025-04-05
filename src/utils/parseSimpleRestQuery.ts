import { Prisma } from '@prisma/client';

type QueryParams = Record<string, string>;

export function parseSimpleRestQuery(query: QueryParams) {
  const _start = parseInt(query._start ?? '0', 10);
  const _end = parseInt(query._end ?? '10', 10);
  const skip = _start;
  const take = _end - _start;

  const orderBy: Prisma.UserOrderByWithRelationInput[] = [];
  if (query._sort && query._order) {
    orderBy.push({
      [query._sort]: query._order.toLowerCase() === 'desc' ? 'desc' : 'asc',
    } as Prisma.UserOrderByWithRelationInput);
  }

  const where: Prisma.UserWhereInput = {};
  for (const key in query) {
    if (key.startsWith('_')) continue;

    const [field, operator] = key.split('_');
    const value = query[key];

    if (!value) continue;

    switch (operator) {
      case 'contains':
        where[field] = { contains: value, mode: 'insensitive' };
        break;
      case 'eq':
        where[field] = value;
        break;
      case 'gte':
        where[field] = { gte: new Date(value) };
        break;
      case 'lte':
        where[field] = { lte: new Date(value) };
        break;
      case 'startsWith':
        where[field] = { startsWith: value, mode: 'insensitive' };
        break;
      case 'endsWith':
        where[field] = { endsWith: value, mode: 'insensitive' };
        break;
    }
  }

  return {
    skip,
    take,
    orderBy,
    where,
  };
}
