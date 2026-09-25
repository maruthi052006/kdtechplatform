import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { questionService } from '../../services/questionService';
import { courseService } from '../../services/courseService';
import { parseExcelQuestionFile, downloadQuestionTemplate } from '../../utils/excelParser';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import {
  FileSpreadsheet,
  UploadCloud,
  Download,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  Check,
  FileCheck,
  HelpCircle,
} from 'lucide-react';

export const QuestionImport = () => {
  const [courses, setCourses] = useState([]);
  const [targetCourseId, setTargetCourseId] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [parseResult, setParseResult] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const { success, error, warning } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const list = courseService.getAllCourses();
    setCourses(list);
    if (list.length > 0) setTargetCourseId(list[0].id);
  }, []);

  const handleFileChange = async (file) => {
    if (!file) return;
    if (!file.name.endsWith('.xlsx')) {
      error('Invalid File Type', 'Please upload an Excel workbook (.xlsx file format).');
      return;
    }

    setSelectedFile(file);
    setIsParsing(true);
    setParseResult(null);

    try {
      const result = await parseExcelQuestionFile(file);
      setParseResult(result);
      if (result.errorCount > 0) {
        warning(
          'Validation Warnings',
          `Parsed ${result.totalRows} rows: ${result.validCount} valid, ${result.errorCount} contained errors.`
        );
      } else {
        success('Validation Passed', `All ${result.validCount} questions passed schema checks.`);
      }
    } catch (err) {
      error('Parse Error', err.message);
      setSelectedFile(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmImport = () => {
    if (!parseResult || parseResult.validQuestions.length === 0) return;
    if (!targetCourseId) {
      error('Selection Required', 'Please choose the target course for imported questions.');
      return;
    }

    setIsImporting(true);
    try {
      const assigned = parseResult.validQuestions.map((q) => ({
        ...q,
        courseId: targetCourseId,
      }));
      questionService.bulkCreateQuestions(assigned);
      success(
        'Import Complete',
        `Successfully imported ${assigned.length} questions into ${courses.find((c) => c.id === targetCourseId)?.name}.`
      );
      navigate('/admin/questions');
    } catch (err) {
      error('Import Failed', err.message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/questions"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-white">Excel Question Ingestion</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Bulk import MCQ questions into the repository using SheetJS (.xlsx parser).
            </p>
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={Download}
          onClick={downloadQuestionTemplate}
        >
          Download Sample .xlsx Template
        </Button>
      </div>

      {/* Target Course Selector */}
      <Card className="p-5 bg-slate-900/90 border-slate-800">
        <div className="max-w-md">
          <Select
            label="Target Course for Questions *"
            value={targetCourseId}
            onChange={(e) => setTargetCourseId(e.target.value)}
            options={courses.map((c) => ({ value: c.id, label: `${c.code} — ${c.name}` }))}
          />
        </div>
      </Card>

      {/* Upload Dropzone */}
      <Card className="p-8 border-dashed border-2 border-slate-700 bg-slate-900/40 text-center hover:border-cyan-500/50 transition-colors">
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="flex flex-col items-center justify-center cursor-pointer"
          onClick={() => document.getElementById('excelFileInput').click()}
        >
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 shadow-inner">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white">
            {selectedFile ? selectedFile.name : 'Choose an Excel (.xlsx) file or drag here'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            Supported columns: question, optionA, optionB, optionC, optionD, answer, topic, difficulty, explanation.
          </p>

          <input
            id="excelFileInput"
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files[0])}
          />

          <div className="mt-5">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              isLoading={isParsing}
              icon={FileSpreadsheet}
            >
              Browse Files (.xlsx)
            </Button>
          </div>
        </div>
      </Card>

      {/* Validation Results & Preview */}
      {parseResult && (
        <div className="space-y-6">
          {/* Summary Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 bg-slate-900/80 border-slate-800 flex items-center gap-3">
              <FileCheck className="w-6 h-6 text-cyan-400 shrink-0" />
              <div>
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Total Rows</span>
                <p className="text-xl font-extrabold text-white">{parseResult.totalRows}</p>
              </div>
            </Card>
            <Card className="p-4 bg-slate-900/80 border-emerald-500/30 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[11px] text-emerald-400 uppercase font-semibold">Valid Questions</span>
                <p className="text-xl font-extrabold text-emerald-300">{parseResult.validCount}</p>
              </div>
            </Card>
            <Card className="p-4 bg-slate-900/80 border-rose-500/30 flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0" />
              <div>
                <span className="text-[11px] text-rose-400 uppercase font-semibold">Error Rows</span>
                <p className="text-xl font-extrabold text-rose-300">{parseResult.errorCount}</p>
              </div>
            </Card>
          </div>

          {/* Errors List */}
          {parseResult.errorCount > 0 && (
            <Card className="p-5 border-rose-500/30 bg-rose-950/20 space-y-3">
              <h4 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Detected Validation Errors ({parseResult.errorCount} rows)
              </h4>
              <p className="text-xs text-slate-300">
                The following rows will be skipped during import. You can fix them in your spreadsheet or proceed with valid items only.
              </p>

              <div className="max-h-60 overflow-y-auto divide-y divide-slate-800 rounded-xl bg-slate-950/80 border border-slate-800 p-2">
                {parseResult.errors.map((err, i) => (
                  <div key={i} className="py-2.5 px-3 text-xs flex items-start justify-between gap-4">
                    <div>
                      <span className="font-mono font-bold text-rose-400 mr-2">Row {err.row}:</span>
                      <span className="text-slate-300">{err.question}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 shrink-0">
                      {err.errors.map((e, eIdx) => (
                        <span key={eIdx} className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px]">
                          {e}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Valid Questions Preview */}
          {parseResult.validCount > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Ready for Ingestion ({parseResult.validCount} Questions)
                </h4>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleConfirmImport}
                  isLoading={isImporting}
                  icon={Check}
                >
                  Confirm & Import ({parseResult.validCount}) Questions
                </Button>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                      <tr>
                        <th className="px-4 py-3">Question</th>
                        <th className="px-4 py-3">Topic</th>
                        <th className="px-4 py-3">Difficulty</th>
                        <th className="px-4 py-3">Correct Answer</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {parseResult.validQuestions.map((q, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          <td className="px-4 py-3 max-w-md">
                            <div className="font-medium text-white">{q.question}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                              A: {q.optionA} | B: {q.optionB} | C: {q.optionC} | D: {q.optionD}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-400">{q.topic}</td>
                          <td className="px-4 py-3">
                            <Badge variant="cyan" size="xs">
                              {q.difficulty}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 font-bold text-emerald-400 font-mono">
                            Option {q.correctAnswer}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
