import { Inject, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProductCategoryService } from '../services/product-category.service';

export @ApiTags('product-categories')
@Controller('products/categories')
class ProductCategoryController {
  constructor(@Inject(ProductCategoryService) productCategoryService) {
    this.productCategoryService = productCategoryService;
  }

  @Get()
  @ApiOperation({ summary: 'List product category groups and subcategories' })
  @ApiResponse({ status: 200, description: 'Category catalog retrieved successfully' })
  findAll() {
    return this.productCategoryService.findAll();
  }

  @Get('groups/:code')
  @ApiOperation({ summary: 'Get a product category group by code' })
  @ApiParam({ name: 'code', example: 'MEN' })
  @ApiResponse({ status: 200, description: 'Category group retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Category group not found' })
  findGroup(@Param('code') code) {
    return this.productCategoryService.findGroupByCode(code.toUpperCase());
  }

  @Post('seed')
  @HttpCode(200)
  @ApiOperation({ summary: 'Seed default product category catalog (idempotent)' })
  @ApiResponse({ status: 200, description: 'Categories seeded successfully' })
  seed() {
    return this.productCategoryService.seedCatalogCategories();
  }
}
