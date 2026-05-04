import { PrismaClient } from '@prisma/client';
import { AppError } from '@/utils/app.error';
import { logger } from '@/shared/utils/logger';
import { ErrorCode } from '@/utils/error.codes';
import { singleton } from '@/shared/decorators/singleton';
import {
  LookupStatus,
  ILookupCategory,
  ILookupValue,
  UserRoleEnum,
  UserTypeEnum,
} from '@/shared/models/common/enums';
import {
  ILookupCategoryCreate,
  ILookupValueCreate,
  toLookupCategoryDomain,
  toLookupValueDomain,
  toLookupCategoryMinimal,
  ILookupCategoryMinimal,
} from '@/shared/models/domain/support/lookup.domain';

@singleton
export class LookupService {
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  private validateAdminWithSupport(
    userRole: UserRoleEnum,
    userType: UserTypeEnum,
    operation: string,
    isReadOperation: boolean = false
  ): boolean {
    logger.info({
      message: 'Validating user role and type',
      context: 'LookupService.validateAdminWithSupport',
      userRole,
      userType,
      operation,
      isReadOperation,
    });

    const isAdminWithSupport =
      userRole === UserRoleEnum.ADMIN && userType === UserTypeEnum.SUPPORT;

    if (!isAdminWithSupport && !isReadOperation) {
      throw new AppError(
        `Only admin users with support type can ${operation}`,
        403,
        ErrorCode.FORBIDDEN
      );
    }

    return isAdminWithSupport;
  }

  async createLookupCategory(
    data: ILookupCategoryCreate,
    userRole: UserRoleEnum,
    userType: UserTypeEnum
  ): Promise<ILookupCategory> {
    try {
      this.validateAdminWithSupport(
        userRole,
        userType,
        'create lookup categories',
        false
      );

      const trimmedName = data.name.trim().toLowerCase();
      const trimmedLabel = data.label.trim();

      if (!/^[a-z0-9_]+$/.test(trimmedName)) {
        throw new AppError(
          'Category name must contain only lowercase letters, numbers, and underscores',
          400,
          ErrorCode.VALIDATION_ERROR
        );
      }

      const existingCategory = await this.prisma.lookup_category.findFirst({
        where: {
          name: {
            equals: trimmedName,
            mode: 'insensitive',
          },
        },
      });

      if (existingCategory) {
        throw new AppError(
          'Lookup category with this name already exists',
          400,
          ErrorCode.VALIDATION_ERROR
        );
      }

      const lookupCategory = await this.prisma.lookup_category.create({
        data: {
          name: trimmedName,
          label: trimmedLabel,
          status: data.status || LookupStatus.ACTIVE,
        },
        include: {
          lookupValues: true,
        },
      });

      return toLookupCategoryDomain(lookupCategory);
    } catch (error) {
      logger.error({
        message: 'Failed to create lookup category',
        context: 'LookupService.createLookupCategory',
        error,
        data,
        userRole,
        userType,
      });
      throw error;
    }
  }

  async getLookupCategories(
    userRole: UserRoleEnum,
    userType: UserTypeEnum
  ): Promise<ILookupCategory[] | ILookupCategoryMinimal[]> {
    try {
      const isAdminWithSupport = this.validateAdminWithSupport(
        userRole,
        userType,
        'view lookup categories',
        true
      );

      const whereClause = isAdminWithSupport
        ? {}
        : { status: LookupStatus.ACTIVE };

      const lookupCategories = await this.prisma.lookup_category.findMany({
        where: whereClause,
        include: {
          lookupValues: {
            where: isAdminWithSupport ? {} : { status: LookupStatus.ACTIVE },
            orderBy: { label: 'asc' },
            select: {
              id: true,
              label: true,
              lookupCategoryId: true,
              status: true,
            },
          },
        },
        orderBy: { label: 'asc' },
      });

      return isAdminWithSupport
        ? lookupCategories.map(toLookupCategoryDomain)
        : lookupCategories.map((category: any) => ({
            ...toLookupCategoryMinimal(category),
            status: category.status,
          }));
    } catch (error) {
      logger.error({
        message: 'Failed to get lookup categories',
        context: 'LookupService.getLookupCategories',
        error,
        userRole,
        userType,
      });
      throw error;
    }
  }

  async getLookupCategoryById(
    id: string,
    userRole: UserRoleEnum,
    userType: UserTypeEnum
  ): Promise<ILookupCategory> {
    try {
      const isAdminWithSupport = this.validateAdminWithSupport(
        userRole,
        userType,
        'view lookup category',
        true
      );

      const category = await this.prisma.lookup_category.findUnique({
        where: { id },
        include: {
          lookupValues: {
            where: isAdminWithSupport ? {} : { status: LookupStatus.ACTIVE },
            orderBy: { label: 'asc' },
            select: {
              id: true,
              label: true,
              lookupCategoryId: true,
              status: true,
            },
          },
        },
      });

      if (!category) {
        throw new AppError(
          'Lookup category not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      return toLookupCategoryDomain(category);
    } catch (error) {
      logger.error({
        message: 'Failed to get lookup category by id',
        context: 'LookupService.getLookupCategoryById',
        error,
        lookupCategoryId: id,
        userRole,
        userType,
      });
      throw error;
    }
  }

  async deleteLookupCategory(
    id: string,
    userRole: UserRoleEnum,
    userType: UserTypeEnum
  ): Promise<void> {
    try {
      this.validateAdminWithSupport(
        userRole,
        userType,
        'delete lookup categories'
      );

      const existingCategory = await this.prisma.lookup_category.findUnique({
        where: { id },
      });

      if (!existingCategory) {
        throw new AppError(
          'Lookup category not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      await this.prisma.$transaction([
        this.prisma.lookup_category.update({
          where: { id },
          data: { status: LookupStatus.INACTIVE },
        }),
        this.prisma.lookup_value.updateMany({
          where: { lookupCategoryId: id },
          data: { status: LookupStatus.INACTIVE },
        }),
      ]);
    } catch (error) {
      logger.error({
        message: 'Failed to delete lookup category',
        context: 'LookupService.deleteLookupCategory',
        error,
        lookupCategoryId: id,
        userRole,
        userType,
      });
      throw error;
    }
  }

  async createLookupValue(
    data: ILookupValueCreate,
    userRole: UserRoleEnum,
    userType: UserTypeEnum
  ): Promise<ILookupValue> {
    try {
      this.validateAdminWithSupport(userRole, userType, 'create lookup values');

      const trimmedLabel = data.label.trim();

      const lookupCategory = await this.prisma.lookup_category.findUnique({
        where: { id: data.lookupCategoryId },
      });

      if (!lookupCategory) {
        throw new AppError(
          'Lookup category not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      if (lookupCategory.status === LookupStatus.INACTIVE) {
        throw new AppError(
          'Cannot add values to inactive lookup category. Please activate the category first.',
          400,
          ErrorCode.VALIDATION_ERROR
        );
      }

      const existingLookupValue = await this.prisma.lookup_value.findFirst({
        where: {
          label: {
            equals: trimmedLabel,
            mode: 'insensitive',
          },
          lookupCategoryId: data.lookupCategoryId,
        },
      });

      if (existingLookupValue) {
        throw new AppError(
          'Lookup value with this label already exists in this category',
          400,
          ErrorCode.VALIDATION_ERROR
        );
      }

      const lookupValue = await this.prisma.lookup_value.create({
        data: {
          label: trimmedLabel,
          lookupCategoryId: data.lookupCategoryId,
          status: data.status || LookupStatus.ACTIVE,
        },
        include: {
          lookupCategory: true,
        },
      });

      return toLookupValueDomain(lookupValue);
    } catch (error) {
      logger.error({
        message: 'Failed to create lookup value',
        context: 'LookupService.createLookupValue',
        error,
        data,
        userRole,
        userType,
      });
      throw error;
    }
  }

  async deleteLookupValue(
    id: string,
    userRole: UserRoleEnum,
    userType: UserTypeEnum
  ): Promise<void> {
    try {
      this.validateAdminWithSupport(userRole, userType, 'delete lookup values');

      const existingValue = await this.prisma.lookup_value.findUnique({
        where: { id },
      });

      if (!existingValue) {
        throw new AppError('Lookup value not found', 404, ErrorCode.NOT_FOUND);
      }

      await this.prisma.lookup_value.update({
        where: { id },
        data: { status: LookupStatus.INACTIVE },
      });
    } catch (error) {
      logger.error({
        message: 'Failed to delete lookup value',
        context: 'LookupService.deleteLookupValue',
        error,
        lookupValueId: id,
        userRole,
        userType,
      });
      throw error;
    }
  }

  async getLookupValuesByCategories(
    categoryNames: string[],
    userRole: UserRoleEnum,
    userType: UserTypeEnum
  ): Promise<ILookupCategory[] | ILookupCategoryMinimal[]> {
    try {
      const isAdminWithSupport = this.validateAdminWithSupport(
        userRole,
        userType,
        'view lookup categories',
        true
      );

      const whereClause = {
        name: {
          in: categoryNames,
        },
        ...(isAdminWithSupport ? {} : { status: LookupStatus.ACTIVE }),
      };

      const lookupCategories = await this.prisma.lookup_category.findMany({
        where: whereClause,
        include: {
          lookupValues: {
            where: isAdminWithSupport ? {} : { status: LookupStatus.ACTIVE },
            orderBy: { label: 'asc' },
            select: {
              id: true,
              label: true,
              lookupCategoryId: true,
              status: true,
            },
          },
        },
        orderBy: { label: 'asc' },
      });

      if (lookupCategories.length === 0) {
        throw new AppError(
          'No lookup categories found with the provided names',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      return isAdminWithSupport
        ? lookupCategories.map(toLookupCategoryDomain)
        : lookupCategories.map(toLookupCategoryMinimal);
    } catch (error) {
      logger.error({
        message: 'Failed to get lookup values by categories',
        context: 'LookupService.getLookupValuesByCategories',
        error,
        categoryNames,
        userRole,
        userType,
      });
      throw error;
    }
  }

  async getCountries(): Promise<{ code: string; name: string }[]> {
    const ct: any = await import('countries-and-timezones');
    const countriesObj = ct.getAllCountries();
    return Object.values(countriesObj).map((country: any) => ({
      code: country.id,
      name: country.name,
    }));
  }

  async getTimezonesByCountry(countryCode: string): Promise<
    {
      name: string;
      tzCode: string;
      utcOffset: number;
      utcOffsetStr: string;
    }[]
  > {
    if (!countryCode || countryCode.length !== 2) {
      throw new AppError(
        "Invalid country code. Must be ISO 3166-1 alpha-2 (e.g. 'US')",
        400,
        ErrorCode.VALIDATION_ERROR
      );
    }
    const ct: any = await import('countries-and-timezones');
    const country = ct.getCountry(countryCode);
    if (!country) {
      throw new AppError(
        `Country code '${countryCode}' not found`,
        400,
        ErrorCode.VALIDATION_ERROR
      );
    }
    const tzs = country.timezones || [];
    return tzs
      .map((tzCode: string) => {
        const tz = ct.getTimezone(tzCode);
        if (!tz) return undefined;
        return {
          name: tz.name,
          tzCode: tz.name,
          utcOffset: tz.utcOffset,
          utcOffsetStr: tz.utcOffsetStr,
        };
      })
      .filter(Boolean);
  }
}
