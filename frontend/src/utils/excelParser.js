// Excel Ingestion & Validation Utility using SheetJS (xlsx)
import * as XLSX from 'xlsx';

export const parseExcelQuestionFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          throw new Error('The workbook contains no sheets.');
        }

        const worksheet = workbook.Sheets[firstSheetName];
        // Convert to array of objects with raw values
        const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rows || rows.length === 0) {
          throw new Error('The uploaded Excel sheet contains no data rows.');
        }

        const validQuestions = [];
        const errors = [];

        rows.forEach((row, index) => {
          const rowNum = index + 2; // Accounting for 1-based header row
          const rowErrors = [];

          // Standardize column names (handling case differences)
          const qText = (row.question || row.Question || '').toString().trim();
          const optA = (row.optionA || row.OptionA || row['option A'] || '').toString().trim();
          const optB = (row.optionB || row.OptionB || row['option B'] || '').toString().trim();
          const optC = (row.optionC || row.OptionC || row['option C'] || '').toString().trim();
          const optD = (row.optionD || row.OptionD || row['option D'] || '').toString().trim();
          const rawAns = (row.answer || row.Answer || row.correctAnswer || '').toString().trim().toUpperCase();
          const topic = (row.topic || row.Topic || 'General').toString().trim();
          let difficulty = (row.difficulty || row.Difficulty || 'Medium').toString().trim();
          const explanation = (row.explanation || row.Explanation || '').toString().trim();

          // Validations
          if (!qText) {
            rowErrors.push('Missing question text');
          }
          if (!optA) rowErrors.push('Missing option A');
          if (!optB) rowErrors.push('Missing option B');
          if (!optC) rowErrors.push('Missing option C');
          if (!optD) rowErrors.push('Missing option D');

          if (!['A', 'B', 'C', 'D'].includes(rawAns)) {
            rowErrors.push(`Invalid answer "${rawAns}". Must be A, B, C, or D.`);
          }

          if (!['Easy', 'Medium', 'Hard'].includes(difficulty)) {
            difficulty = 'Medium'; // Gracefully sanitize
          }

          if (rowErrors.length > 0) {
            errors.push({
              row: rowNum,
              question: qText || '(Empty Question)',
              errors: rowErrors,
            });
          } else {
            validQuestions.push({
              question: qText,
              optionA: optA,
              optionB: optB,
              optionC: optC,
              optionD: optD,
              options: [
                { key: 'A', text: optA },
                { key: 'B', text: optB },
                { key: 'C', text: optC },
                { key: 'D', text: optD },
              ],
              correctAnswer: rawAns,
              topic: topic || 'General',
              difficulty,
              explanation,
            });
          }
        });

        resolve({
          totalRows: rows.length,
          validCount: validQuestions.length,
          errorCount: errors.length,
          validQuestions,
          errors,
        });
      } catch (err) {
        reject(new Error(`Failed to parse Excel workbook: ${err.message}`));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read the uploaded file.'));
    reader.readAsArrayBuffer(file);
  });
};

// Generates and triggers download of an official sample Excel template
export const downloadQuestionTemplate = () => {
  const headers = [
    'question',
    'optionA',
    'optionB',
    'optionC',
    'optionD',
    'answer',
    'topic',
    'difficulty',
    'explanation',
  ];

  const sampleRows = [
    [
      'Which keyword is used to define a function in Python?',
      'function',
      'def',
      'func',
      'define',
      'B',
      'Functions',
      'Easy',
      'The def keyword introduces a function definition in Python.',
    ],
    [
      'Which of the following data structures is immutable in Python?',
      'list',
      'dict',
      'set',
      'tuple',
      'D',
      'Data Types',
      'Easy',
      'Tuples cannot be modified once instantiated.',
    ],
    [
      'What is the result of bool([] == False)?',
      'True',
      'False',
      'TypeError',
      'None',
      'B',
      'Expressions',
      'Medium',
      '[] does not equal False in value comparison.',
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Questions');

  XLSX.writeFile(wb, 'KDTechX_Question_Import_Template.xlsx');
};
