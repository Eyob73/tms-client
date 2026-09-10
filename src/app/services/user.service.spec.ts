import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { UserService } from './user.service';
import { User, CreateUserRequest, UpdateUserRequest } from '../models/user.model';
import { PagedResponse } from '../models/course.model';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  const mockUser: User = {
    id: 'user-123',
    userName: 'Abebe',
    email: 'abebe@tms.local',
    firstName: 'Abebe',
    lastName: 'Kebede',
    phoneNumber: '+1234567890',
    department: 'Computer Science',
    isActive: true,
    roles: ['Instructor'],
    createdAt: '2026-09-01T10:00:00Z',
    updatedAt: null,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserService],
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('getUsers() formats query parameters and retrieves paged users', async () => {
    const mockPagedResponse: PagedResponse<User> = {
      items: [mockUser],
      totalCount: 1,
      page: 1,
      pageSize: 10,
      totalPages: 1,
      hasPrevious: false,
      hasNext: false,
    };

    const promise = firstValueFrom(
      service.getUsers({
        page: 1,
        pageSize: 10,
        search: 'Abebe',
        role: 'Instructor',
        isActive: true,
      })
    );

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/users'));
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('pageSize')).toBe('10');
    expect(req.request.params.get('search')).toBe('Abebe');
    expect(req.request.params.get('role')).toBe('Instructor');
    expect(req.request.params.get('isActive')).toBe('true');

    req.flush(mockPagedResponse);
    const result = await promise;
    expect(result.items.length).toBe(1);
    expect(result.items[0].userName).toBe('Abebe');
  });

  it('getUserById() issues GET /api/users/{id}', async () => {
    const promise = firstValueFrom(service.getUserById('user-123'));

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/users/user-123'));
    expect(req.request.method).toBe('GET');
    req.flush(mockUser);

    const user = await promise;
    expect(user.id).toBe('user-123');
    expect(user.email).toBe('Abebe@tms.local');
  });

  it('createUser() issues POST /api/users with payload', async () => {
    const payload: CreateUserRequest = {
      userName: 'newuser',
      email: 'new@tms.local',
      firstName: 'New',
      lastName: 'User',
      password: 'Password123!',
      roles: ['Student'],
      isActive: true,
    };

    const promise = firstValueFrom(service.createUser(payload));

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/users'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ ...mockUser, id: 'user-new', userName: 'newuser' });

    const created = await promise;
    expect(created.id).toBe('user-new');
  });

  it('updateStatus() issues PATCH /api/users/{id}/status', async () => {
    const promise = firstValueFrom(service.updateStatus('user-123', false));

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/users/user-123/status'));
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ isActive: false });
    req.flush({ ...mockUser, isActive: false });

    const updated = await promise;
    expect(updated.isActive).toBe(false);
  });

  it('updateUserRoles() issues PUT /api/users/{id}/roles', async () => {
    const promise = firstValueFrom(service.updateUserRoles('user-123', ['Admin', 'Instructor']));

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/users/user-123/roles'));
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ roles: ['Admin', 'Instructor'] });
    req.flush(['Admin', 'Instructor']);

    const roles = await promise;
    expect(roles).toEqual(['Admin', 'Instructor']);
  });

  it('deleteUser() issues DELETE /api/users/{id}', async () => {
    const promise = firstValueFrom(service.deleteUser('user-123'));

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/users/user-123'));
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'User deleted successfully.' });

    const res = await promise;
    expect(res.message).toContain('deleted');
  });

  it('getUserStats() queries parallel counts and aggregates statistics', async () => {
    const promise = firstValueFrom(service.getUserStats());

    // Expect 5 requests for total, active, inactive, instructors, students
    const requests = httpMock.match((r) => r.url.endsWith('/api/users'));
    expect(requests.length).toBe(5);

    // Flush each request with corresponding totalCount
    requests[0].flush({ items: [], totalCount: 20 }); // total
    requests[1].flush({ items: [], totalCount: 16 }); // active
    requests[2].flush({ items: [], totalCount: 4 });  // inactive
    requests[3].flush({ items: [], totalCount: 5 });  // instructors
    requests[4].flush({ items: [], totalCount: 12 }); // students

    const stats = await promise;
    expect(stats.totalUsers).toBe(20);
    expect(stats.activeUsers).toBe(16);
    expect(stats.inactiveUsers).toBe(4);
    expect(stats.instructorCount).toBe(5);
    expect(stats.studentCount).toBe(12);
  });
});
