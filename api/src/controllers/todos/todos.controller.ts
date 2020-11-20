import { Controller, Req, Get, Post, BodyParams, QueryParams, PathParams, Res, Required, PropertyType, Delete, Patch, Property } from '@tsed/common';
import { TodoList } from '../../entities/todo-list';
import { Summary, ReturnsArray, Returns, BaseParameter, Description } from '@tsed/swagger';
import { TodosService } from '../../services/todos/todos.service';
import { Auth } from '../../decorators/auth.decorator';
import { Todo } from '../../entities/todo';
import { NotFound } from '@tsed/exceptions';
import { SortDirection } from '../../enums/sort-direction.enum';
import { TodoListSortBy } from '../../enums/todo-list-sort-by.enum';
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGE } from '../../constants';
import { CustomHeader } from '../../enums/custom-headers.enum';

class CreateTodoItemData {
  @Required()
  title: string;

  @Property()
  done: boolean;
}

class CreateTodoData {
  @Required()
  title: string;

  @PropertyType(CreateTodoItemData)
  todos: Array<CreateTodoItemData>;
}

class PatchTodoData {
  @Property()
  uuid: string;

  @Property()
  title: string;

  @PropertyType(Todo)
  todos: Array<Todo>;
}

@Controller('/todo-lists')
export class TodosController {
  constructor(
    private readonly todosService: TodosService,
  ) {}

  @Get('/')
  @Summary('Get all of the user\'s Todo lists')
  @Auth({
    passUser: true,
  })
  @ReturnsArray(TodoList)
  async fetchAll(
    @Description('Relationships to load. Possible values: `todos`') @QueryParams('relations', String) relations: Array<string>,
    @QueryParams('pageNumber') @BaseParameter({ default: DEFAULT_PAGE }) pageNumber: number,
    @QueryParams('pageSize') @BaseParameter({ default: DEFAULT_PAGE_SIZE }) pageSize: number,
    @QueryParams('sortBy') @BaseParameter({ default: TodoListSortBy.CREATED, enum: TodoListSortBy }) sortBy: TodoListSortBy,
    @QueryParams('sortDirection') @BaseParameter({ default: SortDirection.DESC, enum: SortDirection  }) sortDirection: SortDirection,
    @QueryParams('title') title: string,
    @Req() req: Req,
    @Res() res: Res,
  ): Promise<Array<TodoList>> {
    const pagedResult = await this.todosService.fetchAll({
      user: req.user,
      relations,
      page: {
        number: pageNumber,
        size: pageSize,
      },
      sortBy,
      sortDirection,
      title,
    });

    res.setHeader(CustomHeader.PAGINATION_TOTAL_COUNT, pagedResult.count);

    return pagedResult.results;
  }

  @Get('/:uuid')
  @Summary('Get Todo list by uuid')
  @Auth({
    passUser: true,
  })
  @Returns(TodoList)
  @Returns(404, { description: 'Not found', type: NotFound })
  async fetchById(
    @PathParams('uuid') uuid: string,
    @QueryParams('relations', String) relations: Array<string>,
    @Req() req: Req,
  ): Promise<TodoList> {
    const todoList = await this.todosService.fetchOne({
      user: req.user,
      relations,
      uuid,
    });
    if (!todoList) {
      throw new NotFound(`Todo list with uuid "${uuid}" not found`);
    }

    return todoList;
  }

  @Delete('/:uuid')
  @Summary('Delete Todo list by uuid')
  @Auth({
    passUser: true,
  })
  async delete(
    @PathParams('uuid') uuid: string,
    @Req() req: Req,
    @Res() res: Res,
  ): Promise<void> {
    await this.todosService.delete({
      uuid,
      user: req.user,
    });

    res.sendStatus(204);
  }

  @Patch('/:uuid')
  @Summary('Partial or full opdate of a TodoList by uuid')
  @Auth({
    passUser: true,
  })
  async update(
    @PathParams('uuid') uuid: string,
    @BodyParams() todoData: PatchTodoData,
    @Req() req: Req,
  ): Promise<TodoList> {
    const todoList = await this.todosService.fetchOne({
      uuid,
      user: req.user,
      relations: ['todos'],
    });

    if ('title' in todoData) {
      todoList.title = todoData.title;
    }

    if ('todos' in todoData) {
      const oldTodos = todoList.todos;
      todoList.todos = todoData.todos;
      const newUuids = todoList.todos.map(({ uuid }) => uuid).filter(Boolean);

      for (const oldItem of oldTodos) {
        if (!newUuids.includes(oldItem.uuid)) {
          await oldItem.remove();
        }
      }
    }

    return this.todosService.save(todoList);
  }

  @Post('/')
  @Summary('Create new Todo list')
  @Auth({
    passUser: true,
  })
  @Returns(TodoList)
  async create(
    @BodyParams() todoData: CreateTodoData,
    @Req() req: Req,
  ): Promise<TodoList> {
    const todoList = new TodoList();
    todoList.title = todoData.title;
    todoList.created = new Date();
    todoList.user = req.user;

    const todos = (todoData.todos ?? []).map((todoItemData) => {
      const todoItem = new Todo();
      todoItem.title = todoItemData.title;
      todoItem.done = false;

      return todoItem;
    });
    todoList.todos = todos;

    return this.todosService.save(todoList);
  }
}
