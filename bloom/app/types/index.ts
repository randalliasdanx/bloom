export type Lesson = {
  title: string;
};

export type Chapter = {
  title: string;
  lessons: Lesson[];
};

export type Curriculum = {
  chapters: Chapter[];
};

export type Module = {
  id: string;
  title: string;
  description: string;
  curriculum?: Curriculum;
  textbookOrSubject?: string;
};

export type LessonDetails = {
  objectives: string;
  coreConcepts: string;
};

export type CurriculumModule = Module & {
  curriculum: Curriculum;
}; 