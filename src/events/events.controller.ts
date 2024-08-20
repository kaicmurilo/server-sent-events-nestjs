import { Controller, MessageEvent, Sse } from '@nestjs/common';
import { Observable, Subject, interval, map, takeUntil, tap } from 'rxjs';

interface TaskProgress {
  message: string;
  progress: string;
}

@Controller('events')
export class EventsController {
  private taskCompleted$ = new Subject<void>();
  //envia mensagem conforme tempo configurado
  @Sse('sse')
  sse(): Observable<MessageEvent> {
    return interval(1000).pipe(
      map(() => ({
        data: 'Olá! Esta é uma atualização em tempo real.',
      })),
    );
  }

  //Envia progresso, informa conclusão e fecha conexão se finalizado.
  @Sse('tasks')
  sendEvents(): Observable<MessageEvent> {
    const stop$ = new Subject<void>();

    return interval(1000).pipe(
      map((count: number) => {
        const progress = (count + 1) * 10;
        if (progress < 100) {
          return {
            data: {
              message: `Processando tarefa...`,
              progress: `${progress}%`,
            } as TaskProgress,
          };
        } else {
          stop$.next(); // Emitir um valor para parar o intervalo
          stop$.complete(); // Fechar o Subject
          return {
            data: {
              message: 'Tarefa concluída!',
              progress: '100%',
            } as TaskProgress,
          };
        }
      }),
      takeUntil(stop$), // Para o Observable quando o stop$ emitir um valor
      tap({
        complete: () => console.log('Conexão SSE fechada após a conclusão.'),
      }),
    );
  }

  @Sse('teste')
  source(): Observable<MessageEvent> {
    return interval(1000).pipe(
      map((_) => ({ data: { hello: 'world' } }) as MessageEvent),
    );
  }
}
