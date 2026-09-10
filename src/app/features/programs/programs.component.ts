import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ProgramService, Program } from '../../services/program';
import { ProgramDialogComponent } from './program-dialog.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-programs',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatSortModule,
    MatSelectModule,
  ],
  templateUrl: './programs.component.html',
  styleUrl: './programs.component.scss',
})
export class ProgramsComponent implements OnInit {
  private readonly programService = inject(ProgramService);
  private readonly dialog = inject(MatDialog);

  programs = signal<Program[]>([]);
  isLoading = signal<boolean>(false);
  dataSource = new MatTableDataSource<Program>([]);

  displayedColumns = [
    'name',
    'code',
    'department',
    'status',
    'createdAt',
    'actions',
  ];

  stats = computed(() => {
    const all = this.programs();
    return {
      total: all.length,
      active: all.filter((p) => p.isActive).length,
      inactive: all.filter((p) => !p.isActive).length,
    };
  });

  ngOnInit() {
    this.loadPrograms();
  }

  loadPrograms() {
    this.isLoading.set(true);
    this.programService.getAll().subscribe({
      next: (data) => {
        this.programs.set(data);
        this.dataSource.data = data;
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load programs', err);
        this.isLoading.set(false);
      },
    });
  }

  openDialog(program?: Program) {
    const dialogRef = this.dialog.open(ProgramDialogComponent, {
      width: '600px',
      data: { program },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadPrograms();
      }
    });
  }

  edit(program: Program) {
    this.openDialog(program);
  }

  toggleActive(program: Program) {
    const action = program.isActive ? 'deactivate' : 'activate';
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: `${action === 'activate' ? 'Activate' : 'Deactivate'} Program`,
        message: `Are you sure you want to ${action} ${program.name}?`,
        confirmText: action === 'activate' ? 'Activate' : 'Deactivate',
        isDestructive: action === 'deactivate',
      },
    });

    dialogRef.afterClosed().subscribe((confirm) => {
      if (confirm) {
        this.programService.patch(program.id, { isActive: !program.isActive }).subscribe({
          next: () => {
            this.loadPrograms();
          },
          error: (err) => {
            console.error('Failed to toggle program status', err);
          },
        });
      }
    });
  }

  delete(program: Program) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Program',
        message: `Are you sure you want to delete ${program.name}? This action cannot be undone.`,
        confirmText: 'Delete',
        isDestructive: true,
      },
    });

    dialogRef.afterClosed().subscribe((confirm) => {
      if (confirm) {
        this.programService.delete(program.id).subscribe({
          next: () => {
            this.loadPrograms();
          },
          error: (err) => {
            console.error('Failed to delete program', err);
          },
        });
      }
    });
  }
}
