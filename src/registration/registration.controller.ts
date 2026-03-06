import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  // Delete,
} from '@nestjs/common';
import { RegistrationService } from './registration.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { UpdateRegistrationDto } from './dto/update-registration.dto';
import { PaginationDto } from 'src/common/utils/dto/pagination.dto';
// import { UpdateRegistrationDto } from './dto/update-registration.dto';

@Controller('registration')
export class RegistrationController {
  constructor(private readonly registrationService: RegistrationService) {}

  @Post()
  create(@Body() body: { payload: CreateRegistrationDto }) {
    console.log(body, 'body');
    return this.registrationService.create(body.payload);
  }

  @Get()
  findAll(@Query() query: PaginationDto) {
    return this.registrationService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.registrationService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateRegistrationDto: UpdateRegistrationDto,
  ) {
    return this.registrationService.update(id, updateRegistrationDto);
  }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.registrationService.remove(+id);
  // }
}
