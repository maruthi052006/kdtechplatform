// Results & Analytics Exporter via SheetJS
import * as XLSX from 'xlsx';

export const exportResultsToExcel = (results, fileName = 'KDTechX_Assessment_Results') => {
  const data = results.map((r) => ({
    'Student ID': r.studentIdCode || r.studentId,
    'Student Name': r.studentName,
    'Student Email': r.studentEmail,
    Course: r.courseName,
    'Quiz Title': r.quizTitle,
    'Score Obtained': r.score,
    'Total Marks': r.totalMarks,
    'Percentage (%)': `${r.percentage}%`,
    Status: r.passed ? 'PASSED' : 'FAILED',
    'Correct Answers': r.correctCount,
    'Wrong Answers': r.wrongCount,
    Unanswered: r.unansweredCount,
    'Time Taken (s)': r.timeTakenSeconds,
    'Tab Violations': r.securityLog?.tabSwitches || 0,
    'Submitted At': new Date(r.submittedAt).toLocaleString(),
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Results');

  XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

export const exportResultsToCSV = (results, fileName = 'KDTechX_Assessment_Results') => {
  const data = results.map((r) => ({
    'Student ID': r.studentIdCode || r.studentId,
    'Student Name': r.studentName,
    'Student Email': r.studentEmail,
    Course: r.courseName,
    'Quiz Title': r.quizTitle,
    'Score Obtained': r.score,
    'Total Marks': r.totalMarks,
    'Percentage (%)': r.percentage,
    Status: r.passed ? 'PASSED' : 'FAILED',
    'Correct Answers': r.correctCount,
    'Wrong Answers': r.wrongCount,
    Unanswered: r.unansweredCount,
    'Time Taken (s)': r.timeTakenSeconds,
    'Tab Violations': r.securityLog?.tabSwitches || 0,
    'Submitted At': new Date(r.submittedAt).toISOString(),
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);

  const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
