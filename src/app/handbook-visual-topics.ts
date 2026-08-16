import type { HandbookTopic } from "./handbook-data";

const image = (file: string, alt: string) => ({
  src: new URL(`../../knowledge-base-inbox/images/${file}`, import.meta.url).href,
  alt,
});

/** Images are attached to an existing canonical topic instead of creating a duplicate article. */
export const VISUAL_IMAGES_BY_TOPIC: Record<string, NonNullable<HandbookTopic["images"]>> = {
  f1: [image("7 принципов QA QC.png", "QA, QC и тестирование"), image("триада 2.png", "Триада тестирования")],
  f2: [image("7 принципов.png", "Семь принципов тестирования")],
  auto3: [image("1 Виды тестирования пирамида.png", "Виды и пирамида тестирования")],
  doc4: [
    image("1 тестирование требования.png", "Основы тестирования требований"),
    image("1 тестирование требования виды тестирований ПО.png", "Требования и виды тестирования ПО"),
    image("матрица трессировки, инстурменты тестировщика.png", "Матрица трассировки и инструменты QA"),
  ],
  f7: [image("7 принципов  вериф валид техники тест дизайна.png", "Принципы, верификация и валидация")],
  td1: [image("техники тест дизайна.png", "Основные техники тест-дизайна")],
  td5: [image("предугадывание ошибок.png", "Предугадывание ошибок")],
  doc2: [image("чек лист тест кейс баг репорт.png", "Чек-лист, тест-кейс и баг-репорт"), image("чек лист, тест кейс, жизненный цикл бага.png", "Тестовые артефакты и жизненный цикл дефекта")],
  f6: [image("SDLC STLC 2.png", "SDLC и STLC"), image("SDLC STLC.png", "SDLC, STLC и Agile")],
  f8: [image("Agile.png", "Agile, Scrum и Kanban")],
  tt2: [image("триада Smoke Sanity Reg .png", "Smoke, Sanity и Regression")],
  web1: [image("Http Https.png", "HTTP и HTTPS"), image("dns статусы http.png", "DNS и HTTP-статусы"), image("OSI TCP.png", "OSI и TCP/IP")],
  web11: [image("websoket.png", "Основы WebSocket"), image("websoket2.png", "Расширенное тестирование WebSocket")],
  api1: [image("api.png", "Основы API testing"), image("api2.png", "Расширенное API testing")],
  web6: [image("graphQL Elastic Kafka.png", "GraphQL, Elasticsearch и Kafka")],
  db1: [image("БД СУБД.png", "Базы данных и СУБД"), image("SQL.png", "SQL для тестировщика")],
  webtest2: [image("gui pixelperfect.png", "GUI и Pixel Perfect")],
  webtest4: [image("кэш и куки.png", "Кэш и cookies")],
  web3: [image("логи перехват трафика.png", "Логи и перехват трафика")],
  db3: [image("тестовое окружение идемпотентность.png", "Тестовое окружение и идемпотентность")],
  web4: [image("ожидания мололит и микросервисы.png", "Ожидания, монолит и микросервисы")],
  auto4: [image("Автоматизация CI CD.png", "Автоматизация и CI/CD")],
  auto2: [image("инструменты автоматизации паттерны.png", "Инструменты и паттерны автоматизации")],
  web9: [image("Docker JMetr.png", "Docker и JMeter")],
  git1: [image("CLI GIT.png", "CLI и Git")],
  mob1: [image("тестирование мобильного ПО.png", "Тестирование мобильного ПО")],
};

export const VISUAL_UNIQUE_TOPICS: HandbookTopic[] = [{
  id: "crowdtesting",
  title: "Крауд-тестирование",
  category: "Виды тестирования",
  level: "intermediate",
  tags: ["crowdtesting", "устройства", "локализация"],
  content: `## Крауд-тестирование

Крауд-тестирование привлекает распределённую группу исполнителей и подходит для проверки продукта на реальных устройствах, сетях и локалях. До запуска фиксируют область проверки, требования к доказательствам, правила работы с дублями, конфиденциальными данными и критерии приёмки дефекта. Оно дополняет, но не заменяет управляемое функциональное и регрессионное тестирование команды.`,
  images: [image("Крауд тест .png", "Крауд-тестирование")],
}];
