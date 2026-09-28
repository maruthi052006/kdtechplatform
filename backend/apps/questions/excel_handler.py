import csv
import io
import openpyxl
from decimal import Decimal

REQUIRED_COLUMNS = ['question', 'optiona', 'optionb', 'optionc', 'optiond', 'answer']
VALID_ANSWERS = {'A', 'B', 'C', 'D'}
VALID_DIFFICULTIES = {'easy', 'medium', 'hard'}

def normalize_key(key: str) -> str:
    return key.strip().lower().replace('_', '').replace(' ', '')

def parse_and_validate_file(file_obj, filename: str):
    """
    Parses and thoroughly validates an uploaded .xlsx or .csv spreadsheet file.
    Returns: {
        'success': bool,
        'errors': list of { 'row': int, 'column': str, 'message': str },
        'valid_rows': list of dicts,
        'preview': list of dicts (first 10 valid),
        'total_rows': int,
        'valid_count': int,
        'invalid_count': int
    }
    """
    filename_lower = filename.lower()
    rows = []

    if filename_lower.endswith('.xlsx'):
        try:
            wb = openpyxl.load_workbook(file_obj, data_only=True)
            sheet = wb.active if wb.active is not None else (wb.worksheets[0] if wb.worksheets else None)
            if sheet is None:
                return {
                    'success': False,
                    'error': 'Spreadsheet contains no worksheets.',
                    'errors': [],
                    'valid_rows': [],
                    'preview': [],
                    'total_rows': 0,
                    'valid_count': 0,
                    'invalid_count': 0
                }
            data_iter = sheet.iter_rows(values_only=True)
            header_row = next(data_iter, None)
            if not header_row:
                return {
                    'success': False,
                    'error': 'Spreadsheet is completely empty.',
                    'errors': [],
                    'valid_rows': [],
                    'preview': [],
                    'total_rows': 0,
                    'valid_count': 0,
                    'invalid_count': 0
                }
            headers = [normalize_key(h) if h else '' for h in header_row]
            for row_idx, row in enumerate(data_iter, start=2):
                if not any(row):  # Skip completely empty rows
                    continue
                row_dict = {}
                for h, val in zip(headers, row):
                    if h:
                        row_dict[h] = str(val).strip() if val is not None else ''
                row_dict['_row_num'] = row_idx
                rows.append(row_dict)
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to parse Excel workbook: {str(e)}',
                'errors': [],
                'valid_rows': [],
                'preview': [],
                'total_rows': 0,
                'valid_count': 0,
                'invalid_count': 0
            }
    elif filename_lower.endswith('.csv'):
        try:
            content = file_obj.read().decode('utf-8-sig', errors='replace')
            reader = csv.reader(io.StringIO(content))
            header_row = next(reader, None)
            if not header_row:
                return {
                    'success': False,
                    'error': 'CSV file is empty.',
                    'errors': [],
                    'valid_rows': [],
                    'preview': [],
                    'total_rows': 0,
                    'valid_count': 0,
                    'invalid_count': 0
                }
            headers = [normalize_key(h) for h in header_row]
            for row_idx, row in enumerate(reader, start=2):
                if not any(row):
                    continue
                row_dict = {}
                for h, val in zip(headers, row):
                    if h:
                        row_dict[h] = val.strip()
                row_dict['_row_num'] = row_idx
                rows.append(row_dict)
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to parse CSV file: {str(e)}',
                'errors': [],
                'valid_rows': [],
                'preview': [],
                'total_rows': 0,
                'valid_count': 0,
                'invalid_count': 0
            }
    else:
        return {
            'success': False,
            'error': 'Unsupported file format. Please upload an .xlsx or .csv spreadsheet.',
            'errors': [],
            'valid_rows': [],
            'preview': [],
            'total_rows': 0,
            'valid_count': 0,
            'invalid_count': 0
        }

    # Verify required headers
    missing_headers = [req for req in REQUIRED_COLUMNS if req not in headers]
    if missing_headers:
        return {
            'success': False,
            'error': f"Missing required column headers: {', '.join(missing_headers)}",
            'errors': [{'row': 1, 'column': m, 'message': 'Missing column header'} for m in missing_headers],
            'valid_rows': [],
            'preview': [],
            'total_rows': len(rows),
            'valid_count': 0,
            'invalid_count': len(rows)
        }

    errors = []
    valid_rows = []
    seen_prompts = set()

    for item in rows:
        row_num = item['_row_num']
        row_errors = []

        q_text = item.get('question', '').strip()
        opt_a = item.get('optiona', '').strip()
        opt_b = item.get('optionb', '').strip()
        opt_c = item.get('optionc', '').strip()
        opt_d = item.get('optiond', '').strip()
        raw_ans = item.get('answer', '').strip().upper()
        raw_diff = item.get('difficulty', 'medium').strip().lower() or 'medium'
        raw_topic = item.get('topic', 'General').strip() or 'General'
        raw_explanation = item.get('explanation', '').strip()
        raw_marks = item.get('marks', '1.0').strip() or '1.0'

        # Check required fields
        if not q_text:
            row_errors.append({'row': row_num, 'column': 'question', 'message': 'Question text cannot be blank.'})
        if not opt_a:
            row_errors.append({'row': row_num, 'column': 'optionA', 'message': 'Option A is required.'})
        if not opt_b:
            row_errors.append({'row': row_num, 'column': 'optionB', 'message': 'Option B is required.'})
        if not opt_c:
            row_errors.append({'row': row_num, 'column': 'optionC', 'message': 'Option C is required.'})
        if not opt_d:
            row_errors.append({'row': row_num, 'column': 'optionD', 'message': 'Option D is required.'})

        # Check answer key
        if raw_ans not in VALID_ANSWERS:
            row_errors.append({
                'row': row_num,
                'column': 'answer',
                'message': f"Invalid answer '{raw_ans}'. Must be one of: A, B, C, or D."
            })

        # Check difficulty
        if raw_diff not in VALID_DIFFICULTIES:
            raw_diff = 'medium'

        # Check duplicate prompts within same batch
        clean_prompt = q_text.lower()
        if clean_prompt in seen_prompts:
            row_errors.append({
                'row': row_num,
                'column': 'question',
                'message': 'Duplicate question detected within this spreadsheet.'
            })
        else:
            seen_prompts.add(clean_prompt)

        # Check marks
        try:
            marks_val = float(Decimal(raw_marks))
            if marks_val <= 0 or marks_val > 100:
                marks_val = 1.0
        except Exception:
            marks_val = 1.0

        if row_errors:
            errors.extend(row_errors)
        else:
            valid_rows.append({
                'question_text': q_text,
                'option_a': opt_a,
                'option_b': opt_b,
                'option_c': opt_c,
                'option_d': opt_d,
                'correct_answer': raw_ans,
                'difficulty': raw_diff,
                'topic_name': raw_topic,
                'explanation': raw_explanation,
                'marks': marks_val,
                'row_number': row_num
            })

    return {
        'success': len(errors) == 0,
        'errors': errors,
        'valid_rows': valid_rows,
        'preview': valid_rows[:10],
        'total_rows': len(rows),
        'valid_count': len(valid_rows),
        'invalid_count': len(errors)
    }
