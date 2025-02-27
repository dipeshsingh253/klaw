package io.aiven.klaw.clusterapi.config;

import java.util.concurrent.Executor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

@EnableAsync
@Configuration
public class SchedulerConfig {

  @Value("${klaw.schemainfo.scheduler.threadcount:4}")
  private int poolSize;

  @Bean(name = "resetSchemaCacheTaskExecutor")
  public Executor threadPoolTaskExecutor() {
    ThreadPoolTaskExecutor threadPoolTaskExecutor = new ThreadPoolTaskExecutor();
    threadPoolTaskExecutor.setCorePoolSize(poolSize);
    return threadPoolTaskExecutor;
  }
}
