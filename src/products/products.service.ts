import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PaginationDto } from 'src/common';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

import { PrismaClient } from '@prisma/client';

import { RpcException } from '@nestjs/microservices';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {

	private readonly logger = new Logger('ProductService');

	onModuleInit() {
		this.$connect();
		this.logger.log('Connected to the database');
	}
	create(createProductDto: CreateProductDto) {

		return this.product.create({
			data: createProductDto
		});
	}

	async findAll(paginationDto: PaginationDto) {

		const { limit, page } = paginationDto;

		const totalItems = await this.product.count({
			where: {
				available: true
			}
		});
		const lastPage = Math.ceil(totalItems / limit);

		return {
			data: await this.product.findMany({
				take: limit,
				skip: (page - 1) * limit,
				where: {
					available: true
				}
			}),
			meta: {
				totalItems,
				page,
				lastPage
			}
		}
	}

	async findOne(id: number) {

		const product = await this.product.findFirst({
			where: {
				id,
				available: true
			}
		});

		if (!product) {
			throw new RpcException({
				message: `Product with id ${id} not found`,
				status: HttpStatus.NOT_FOUND
			});
		}

		return product;
	}

	async update(id: number, updateProductDto: UpdateProductDto) {


		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { id: _, ...data } = updateProductDto;

		await this.findOne(id);

		return this.product.update({
			where: {
				id
			},
			data
		});
	}

	async remove(id: number) {

		await this.findOne(id);

		const product = await this.product.update({
			where: {
				id
			},
			data: {
				available: false
			}
		});

		return product;

	}

	async validateProducts(ids: number[]) {

		ids = Array.from(new Set(ids));

		const products = await this.product.findMany({
			where: {
				id: {
					in: ids
				}
			}
		})

		if (products.length !== ids.length) {
			throw new RpcException({
				message: 'Some products were not found',
				status: HttpStatus.BAD_REQUEST
			});
		}

		return products;
	}
}

