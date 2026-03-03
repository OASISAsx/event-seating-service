// src/common/utils/pagination.util.ts

import {
  PaginationMeta,
  PaginationParams,
  PaginationResult,
} from './dto/pagination.dto';

export const getPagination = ({
  page = 1,
  limit = 10,
}: PaginationParams): PaginationResult => {
  const take = Number(limit);
  const skip = (Number(page) - 1) * take;

  return { take, skip, page: Number(page), limit: take };
};

export const buildPaginationMeta = (
  total: number,
  page: number,
  limit: number,
): PaginationMeta => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
});
