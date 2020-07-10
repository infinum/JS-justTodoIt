import { Service } from '@tsed/di';
import { Todo } from '../../entities/todo';
import { User } from '../../entities/user';

interface ITodoFetchingOptions {
  relations?: Array<string>;
  user?: User;
}

interface ITodoFetchOneOptions extends ITodoFetchingOptions {
  uuid: string;
}

@Service()
export class TodosService {
  private readonly todosRepositry = Todo.getRepository();

  public fetchAll({
    relations,
    user,
  }: ITodoFetchingOptions): Promise<Array<Todo>> {
    return this.todosRepositry.find({
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
    return this.todosRepositry.findOne({
      where: {
        uuid,
        user,
      },
      relations,
    });
  }

  public save(todo: Todo): Promise<Todo> {
    return this.todosRepositry.save(todo);
  }
}
