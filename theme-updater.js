const fs = require('fs');

const files = [
  'src/app/shared/confirm-dialog/confirm-dialog.component.scss',
  'src/app/features/users/components/change-password-dialog/change-password-dialog.component.scss',
  'src/app/features/users/components/user-roles-dialog/user-roles-dialog.component.scss',
  'src/app/features/users/components/user-detail/user-detail.component.scss',
  'src/app/features/users/components/user-form/user-form.component.scss',
  'src/app/features/course/add-course/add-course.component.scss',
  'src/app/features/course-detail/course-detail.component.scss'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');

  content = content.replace(/#ffffff|#fff/gi, 'var(--paper-raised)');
  content = content.replace(/#f8fafc|#f1f5f9/gi, 'var(--paper)');
  content = content.replace(/#e2e8f0|#e5e7eb/gi, 'var(--line)');
  content = content.replace(/#eef2f7|#f3f4f6|#f1f3f8/gi, 'var(--line-soft)');
  content = content.replace(/#0f172a|#111827|#1a2140/gi, 'var(--ink)');
  content = content.replace(/#475569|#64748b|#6b7280|#5e6a8a|#374151/gi, 'var(--ink-soft)');
  content = content.replace(/#cbd5e1|#94a3b8|#9ca3af|#7e88a8/gi, 'var(--ink-faint)');
  
  content = content.replace(/box-shadow:[^;]+;/gi, 'box-shadow: 0 4px 12px rgba(22,35,61,0.06);');

  content = content.replace(/border-radius:\s*18px;/g, 'border-radius: var(--radius-m, 8px);');
  content = content.replace(/border-radius:\s*20px;/g, 'border-radius: var(--radius-m, 8px);');
  content = content.replace(/border-radius:\s*24px;/g, 'border-radius: var(--radius-m, 8px);');
  content = content.replace(/border-radius:\s*12px;/g, 'border-radius: var(--radius-s, 4px);');
  content = content.replace(/border-radius:\s*10px;/g, 'border-radius: var(--radius-s, 4px);');

  content = content.replace(/(h1\s*\{|h2\s*\{|h3\s*\{|h4\s*\{|\.section-header h3\s*\{|\.mat-mdc-card-title\s*\{)/g, match => match + '\n  font-family: \'Fraunces\', serif;\n  font-optical-sizing: auto;');
  
  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated', file);
});
