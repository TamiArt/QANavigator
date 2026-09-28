export interface HandbookSection {
  id: string;
  title: string;
  description: string;
  topicIds: string[];
}

export const HANDBOOK_SECTIONS: HandbookSection[] = [
  {
    id: "01-foundations",
    title: "01. Основы QA",
    description: "Базовые понятия, качество, принципы и классификация тестирования.",
    topicIds: [
      "fundamentals-testing",
      "fundamentals-requirements",
      "fundamentals-classification",
      "f7",
      "f1",
      "f2",
    ],
  },
  {
    id: "02-lifecycle",
    title: "02. Требования и жизненный цикл",
    description: "Требования, модели разработки, SDLC/STLC, Agile и Shift-Left.",
    topicIds: [
      "fundamentals-development-models",
      "f6",
      "f8",
      "f4",
    ],
  },
  {
    id: "03-testing-types",
    title: "03. Уровни, виды и циклы тестирования",
    description: "Уровни тестирования и повторяемые циклы проверок от Smoke до Regression.",
    topicIds: [
      "tt2",
    ],
  },
  {
    id: "04-test-design",
    title: "04. Тест-дизайн",
    description: "Основные техники выбора тестовых данных и сценариев.",
    topicIds: [
      "td1",
      "td2",
      "td3",
      "td4",
      "td6",
      "td5",
    ],
  },
  {
    id: "05-web",
    title: "05. Web-тестирование",
    description: "HTTP, клиент-серверное взаимодействие, DevTools, формы, storage и web performance.",
    topicIds: [
      "web1",
      "web4",
      "web3",
      "webtest1",
      "input1",
      "webtest2",
      "webtest4",
      "webtest3",
    ],
  },
  {
    id: "06-api",
    title: "06. API-тестирование",
    description: "REST/SOAP, Postman, OpenAPI, authentication, GraphQL, gRPC и WebSocket.",
    topicIds: [
      "api1",
      "api2",
      "api3",
      "api4",
      "web6",
      "web11",
    ],
  },
  {
    id: "07-data",
    title: "07. Базы данных и тестовые данные",
    description: "SQL, NoSQL, MongoDB и управление тестовыми данными.",
    topicIds: [
      "db1",
      "db2",
      "db3",
    ],
  },
  {
    id: "08-environments",
    title: "08. Окружения и релиз",
    description: "Local, Dev, Test, Integration, Staging и Production: где, что и кем проверяется.",
    topicIds: [
      "env1",
    ],
  },
  {
    id: "09-documentation",
    title: "09. Тестовая документация и дефекты",
    description: "Чек-листы, тест-кейсы, планы, трассировка и управление дефектами.",
    topicIds: [
      "doc2",
      "doc3",
      "doc4",
      "doc1",
      "doc5",
    ],
  },
  {
    id: "10-automation",
    title: "10. Автоматизация и CI/CD",
    description: "Пирамида тестирования, стратегия автоматизации, POM, фреймворки и pipeline.",
    topicIds: [
      "auto3",
      "auto1",
      "auto2",
      "auto4",
    ],
  },
  {
    id: "11-tools-devops",
    title: "11. Инструменты QA и DevOps",
    description: "Git, Bash, Docker, DevTools, API-инструменты и карта рабочих инструментов.",
    topicIds: [
      "tools1",
      "git1",
      "git2",
      "bash1",
      "bash2",
    ],
  },
  {
    id: "12-specialized",
    title: "12. Специализированное тестирование",
    description: "Безопасность, мобильные приложения, crowdtesting и игровые проекты.",
    topicIds: [
      "tt6",
      "tt7",
      "tt4",
      "mob1",
      "mob2",
      "mob3",
      "crowdtesting",
      "game1",
      "game2",
    ],
  },
];

export const HANDBOOK_SECTION_BY_TOPIC = new Map<string, HandbookSection>(
  HANDBOOK_SECTIONS.flatMap((section) =>
    section.topicIds.map((topicId) => [topicId, section] as const),
  ),
);
