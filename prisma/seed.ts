import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create a teacher
  const teacher = await prisma.teacher.create({
    data: { id: "teacher-1", name: "Mr Paranjape", username: "ilovemovienight" },
  });

  // Create mock students
  const studentData = [
      { id: "1", name: "John Doe", username: "johndoe", preferences: { learning: "Visual", mastery: "Intermediate" } },
      { id: "2", name: "Jane Smith", username: "janesmith", preferences: { learning: "Auditory", mastery: "Beginner" } },
      { id: "3", name: "Alice Johnson", username: "alicejohnson", preferences: { mastery: "Advanced" } },
      { id: "4", name: "Bob Brown", username: "bobbrown", preferences: { learning: "Auditory", mastery: "Intermediate" } },
      { id: "5", name: "Charlie Davis", username: "charliedavis", preferences: { learning: "Visual", mastery: "Advanced" } },
  ];

  // Use create (not createMany) so we can attach preferences + connect teacher
  for (const student of studentData) {
    await prisma.student.create({
      data: {
        id: student.id,
        name: student.name,
        username: student.username,
        preferences: student.preferences,
        teachers: {
          connect: { id: teacher.id },
        },
      },
    });
  }

  // Create subjects
  await prisma.subject.createMany({
    data: [
      { id: "1", name: "Mathematics", teacherId: teacher.id },
      { id: "2", name: "Science", teacherId: teacher.id },
      { id: "3", name: "History", teacherId: teacher.id },
      { id: "4", name: "Geography", teacherId: teacher.id },
    ],
  });

  // Create enrollments with progress
  await prisma.enrollment.createMany({
    data: [
      { studentId: "1", subjectId: "1", progress: 72 },
      { studentId: "2", subjectId: "1", progress: 30 },
      { studentId: "3", subjectId: "2", progress: 55 },
      { studentId: "1", subjectId: "4", progress: 45 },
      { studentId: "5", subjectId: "4", progress: 67 },
    ],
  });
}

main()
  .then(() => {
    console.log("Seeding completed.");
  })
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });