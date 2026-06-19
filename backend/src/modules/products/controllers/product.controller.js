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
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DtoValidationPipe } from '../../../common/pipes/dto-validation.pipe';
import { ProductService } from '../services/product.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { QueryProductsDto } from '../dto/query-products.dto';

const queryProductsPipe = DtoValidationPipe(QueryProductsDto);
const createProductPipe = DtoValidationPipe(CreateProductDto);
const updateProductPipe = DtoValidationPipe(UpdateProductDto);

export @ApiTags('products')
@Controller('products')
class ProductController {
  constructor(@Inject(ProductService) productService) {
    this.productService = productService;
  }

  @Get()
  @ApiOperation({
    summary: 'List products with pagination, search, sort, filters',
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
  @ApiOperation({ summary: 'Create a product' })
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
