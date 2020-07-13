import { Service } from '@tsed/di';
import { Todo } from '../../entities/todo';
import { User } from '../../entities/user';
import { DeleteResult } from 'typeorm';

interface ITodoFetchingOptions {
  relations?: Array<string>;
  user?: User;
}

interface ITodoFetchOneOptions extends ITodoFetchingOptions {
  uuid: string;
}

interface IDeleteTodoOptions {
  uuid: string;
  user?: User;
}

@Service()
export class TodosService {
  private readonly repositry = Todo.getRepository();

  public fetchAll({
    relations,
    user,
  }: ITodoFetchingOptions): Promise<Array<Todo>> {
    return this.repositry.find({
      where: {
        user,
      },
      relations,
    });
  }

  public fetchOne({
    uuid,
    relations,
    user,
  }: ITodoFetchOneOptions): Promise<Todo> {
    return this.repositry.findOne({
      where: {
        uuid,
        user,
      },
      relations,
    });
  }

  public delete({
    uuid,
    user
  }: IDeleteTodoOptions): Promise<DeleteResult> {
    return this.repositry.delete({
      uuid,
      user,
    });
  }

  public save(todo: Todo): Promise<Todo> {
    return this.repositry.save(todo);
  }
}
