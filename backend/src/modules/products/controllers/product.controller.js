import {
  Inject,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DtoValidationPipe } from '../../../common/pipes/dto-validation.pipe';
import { ProductService } from '../services/product.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { QueryProductsDto } from '../dto/query-products.dto';
import { SearchProductsDto } from '../dto/search-products.dto';

const queryProductsPipe = DtoValidationPipe(QueryProductsDto);
const searchProductsPipe = DtoValidationPipe(SearchProductsDto);
const createProductPipe = DtoValidationPipe(CreateProductDto);
const updateProductPipe = DtoValidationPipe(UpdateProductDto);

export @ApiTags('products')
@Controller('products')
class ProductController {
  constructor(@Inject(ProductService) productService) {
    this.productService = productService;
  }

  @Get('search/suggest')
  @ApiOperation({
    summary: 'Search autocomplete suggestions',
    description: 'Returns matching products, brands, categories, collections, and styles',
  })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'limit', required: false })
  suggest(@Query() query) {
    return this.productService.suggestSearch(query);
  }

  @Get('search')
  @ApiOperation({
    summary: 'Search products',
    description: 'Full-text search with brand, category, color, and price range filters',
  })
  @ApiQuery({ name: 'q', required: false, description: 'Search query' })
  @ApiQuery({ name: 'search', required: false, description: 'Alias for q' })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Search query is required' })
  search(@Query(searchProductsPipe) query) {
    return this.productService.search(query);
  }

  @Get('category/:category')
  @ApiOperation({
    summary: 'List products by category',
    description: 'Matches category group (e.g. MEN), subcategory slug (e.g. men-jackets), or legacy category_id',
  })
  @ApiParam({
    name: 'category',
    example: 'men-jackets',
    description: 'Category group code, subcategory slug, or legacy category id',
  })
  @ApiResponse({ status: 200, description: 'Category products retrieved successfully' })
  findByCategory(
    @Param('category') category,
    @Query(queryProductsPipe) query,
  ) {
    return this.productService.findByCategory(category, query);
  }

  @Get()
  @ApiOperation({
    summary: 'List products',
    description: 'Paginated catalog with brand, category, color, and price range filters',
  })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  findAll(@Query(queryProductsPipe) query) {
    return this.productService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by id' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiResponse({ status: 200, description: 'Product retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  findOne(@Param('id') id) {
    return this.productService.findOne(id);
  }

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Create a catalog product' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ApiResponse({ status: 409, description: 'SKU already exists' })
  create(@Body(createProductPipe) dto) {
    return this.productService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a product' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 409, description: 'SKU already exists' })
  update(@Param('id') id, @Body(updateProductPipe) dto) {
    return this.productService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a product' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  remove(@Param('id') id) {
    return this.productService.remove(id);
  }
}
