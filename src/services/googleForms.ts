/**
 * Google Forms & Drive API Service
 */

export interface FormItemQuestion {
  title: string;
  description?: string;
  type: 'TEXT' | 'PARAGRAPH' | 'RADIO' | 'DROP_DOWN' | 'CHECKBOX';
  required: boolean;
  options?: string[];
}

export interface GoogleFormItem {
  itemId: string;
  title: string;
  description?: string;
  questionItem?: {
    question: {
      questionId: string;
      required?: boolean;
      textQuestion?: {
        paragraph?: boolean;
      };
      choiceQuestion?: {
        type: 'RADIO' | 'DROP_DOWN' | 'CHECKBOX';
        options: Array<{ value: string }>;
      };
    };
  };
}

export interface GoogleFormDetails {
  formId: string;
  info: {
    title: string;
    documentTitle?: string;
    description?: string;
  };
  items?: GoogleFormItem[];
  revisionId?: string;
  responderUri?: string;
  linkedSheetId?: string;
}

export interface GoogleFormAnswer {
  questionId: string;
  textAnswers?: {
    answers?: Array<{ value: string }>;
  };
}

export interface GoogleFormSubmission {
  responseId: string;
  createTime: string;
  lastSubmittedTime: string;
  respondentEmail?: string;
  answers?: Record<string, GoogleFormAnswer>;
}

export interface ParsedStudentRegistration {
  responseId: string;
  submittedAt: string;
  name: string;
  course: string;
  yearOfStudy: string;
  department: string;
  email?: string;
  otherAnswers: Record<string, string>;
}

export interface FormCreationConfig {
  title: string;
  description: string;
  questions: FormItemQuestion[];
}

export const DEFAULT_STUDENT_FORM_CONFIG: FormCreationConfig = {
  title: 'Student Registration Form',
  description: 'Official registration form. Please provide your details accurately.',
  questions: [
    {
      title: 'Full Name',
      description: 'Enter your full legal name (e.g., Alex Johnson)',
      type: 'TEXT',
      required: true,
    },
    {
      title: 'Course',
      description: 'e.g., BSc Computer Science, BEng Mechanical Engineering, BA Business Management',
      type: 'TEXT',
      required: true,
    },
    {
      title: 'Year of Study',
      description: 'Select your current academic stage',
      type: 'RADIO',
      required: true,
      options: [
        'Year 1 (Freshman)',
        'Year 2 (Sophomore)',
        'Year 3 (Junior)',
        'Year 4 (Senior)',
        'Postgraduate / Master\'s',
        'Doctorate / PhD'
      ]
    },
    {
      title: 'Department',
      description: 'Select your academic department / school',
      type: 'DROP_DOWN',
      required: true,
      options: [
        'Department of Computer Science',
        'Department of Electrical & Electronic Engineering',
        'Department of Mechanical & Aerospace Engineering',
        'Department of Business Administration & Management',
        'Department of Economics & Finance',
        'Department of Biological & Biomedical Sciences',
        'Department of Mathematics & Statistics',
        'Department of Humanities & Social Sciences',
        'Department of Law & Legal Studies',
        'Department of Arts, Media & Design',
        'Other Department'
      ]
    }
  ]
};

/**
 * Creates a new Google Form and populates it with questions.
 */
export async function createGoogleForm(
  accessToken: string,
  config: FormCreationConfig
): Promise<GoogleFormDetails> {
  // Step 1: Create the empty Google Form
  const createRes = await fetch('https://forms.googleapis.com/v1/forms', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      info: {
        title: config.title,
        documentTitle: config.title,
      },
    }),
  });

  if (!createRes.ok) {
    const errorData = await createRes.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `Failed to create form (HTTP ${createRes.status})`
    );
  }

  const newForm: GoogleFormDetails = await createRes.json();
  const formId = newForm.formId;

  // Step 2: Batch update to set description and append questions
  const requests: any[] = [];

  // Update description if provided
  if (config.description) {
    requests.push({
      updateFormInfo: {
        info: {
          description: config.description,
        },
        updateMask: 'description',
      },
    });
  }

  // Create question items
  config.questions.forEach((q, index) => {
    let questionPayload: any = {
      required: q.required,
    };

    if (q.type === 'TEXT' || q.type === 'PARAGRAPH') {
      questionPayload.textQuestion = {
        paragraph: q.type === 'PARAGRAPH',
      };
    } else {
      questionPayload.choiceQuestion = {
        type: q.type,
        options: (q.options || ['Option 1']).map((opt) => ({ value: opt })),
        shuffle: false,
      };
    }

    requests.push({
      createItem: {
        item: {
          title: q.title,
          description: q.description || '',
          questionItem: {
            question: questionPayload,
          },
        },
        location: {
          index,
        },
      },
    });
  });

  if (requests.length > 0) {
    const batchRes = await fetch(`https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests }),
    });

    if (!batchRes.ok) {
      const err = await batchRes.json().catch(() => ({}));
      console.warn('Form created but batch update items failed:', err);
      // We still return the created form, but notify user
    }
  }

  // Step 3: Fetch the finalized form details to get updated items & responderUri
  return await getGoogleForm(accessToken, formId);
}

/**
 * Fetch an existing form by ID
 */
export async function getGoogleForm(
  accessToken: string,
  formId: string
): Promise<GoogleFormDetails> {
  const res = await fetch(`https://forms.googleapis.com/v1/forms/${formId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `Failed to fetch form ${formId} (HTTP ${res.status})`
    );
  }

  return await res.json();
}

/**
 * Fetch responses submitted to a form
 */
export async function getFormResponses(
  accessToken: string,
  formId: string
): Promise<GoogleFormSubmission[]> {
  const res = await fetch(`https://forms.googleapis.com/v1/forms/${formId}/responses`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `Failed to fetch responses (HTTP ${res.status})`
    );
  }

  const data = await res.json();
  return data.responses || [];
}

/**
 * List Google Forms accessible by the app via Drive API
 */
export async function listAppForms(
  accessToken: string
): Promise<Array<{ id: string; name: string; createdTime: string; modifiedTime: string; webViewLink?: string }>> {
  const q = encodeURIComponent("mimeType='application/vnd.google-apps.form' and trashed=false");
  const fields = encodeURIComponent('files(id, name, createdTime, modifiedTime, webViewLink)');
  const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}&orderBy=modifiedTime desc&pageSize=20`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    console.warn('Failed to query Drive for forms:', res.status);
    return [];
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Map raw submissions to structured registration records
 */
export function parseRegistrations(
  form: GoogleFormDetails,
  submissions: GoogleFormSubmission[]
): ParsedStudentRegistration[] {
  // Build lookup mapping questionId -> question title (lowercased)
  const questionMap: Record<string, { title: string; originalTitle: string }> = {};

  form.items?.forEach((item) => {
    if (item.questionItem?.question?.questionId) {
      questionMap[item.questionItem.question.questionId] = {
        title: item.title.trim().toLowerCase(),
        originalTitle: item.title,
      };
    }
  });

  return submissions.map((sub) => {
    let name = '';
    let course = '';
    let yearOfStudy = '';
    let department = '';
    const otherAnswers: Record<string, string> = {};

    if (sub.answers) {
      Object.entries(sub.answers).forEach(([qId, ans]) => {
        const val = ans.textAnswers?.answers?.map((a) => a.value).join(', ') || '';
        const meta = questionMap[qId];
        const titleLower = meta ? meta.title : '';

        if (titleLower.includes('name') || titleLower.includes('person') || titleLower.includes('student')) {
          name = val;
        } else if (titleLower.includes('course') || titleLower.includes('program') || titleLower.includes('degree')) {
          course = val;
        } else if (titleLower.includes('year') || titleLower.includes('stage') || titleLower.includes('level')) {
          yearOfStudy = val;
        } else if (titleLower.includes('department') || titleLower.includes('faculty') || titleLower.includes('dept')) {
          department = val;
        } else {
          const key = meta ? meta.originalTitle : qId;
          otherAnswers[key] = val;
        }
      });
    }

    return {
      responseId: sub.responseId,
      submittedAt: sub.lastSubmittedTime || sub.createTime,
      name: name || 'Anonymous Student',
      course: course || 'Not Specified',
      yearOfStudy: yearOfStudy || 'Not Specified',
      department: department || 'Not Specified',
      email: sub.respondentEmail,
      otherAnswers,
    };
  });
}
