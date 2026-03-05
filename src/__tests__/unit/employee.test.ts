import { describe, test, expect, beforeEach } from '@jest/globals';
import Employee from '../../models/Employee';

describe('Employee Model', () => {
  let employeeData: any;

  beforeEach(() => {
    employeeData = {
      name: 'Ram Kumar Singh',
      email: 'ram@example.com',
      phone: '+977-9841234567',
      position: 'Chef',
      department: 'Kitchen',
      salary: 25000,
      joinDate: new Date('2023-01-15'),
      experience: 5,
      skills: ['Cooking', 'Food Preparation', 'Team Management'],
      address: '123 Main Street, Kathmandu',
      status: 'active',
      idProof: 'https://example.com/id.jpg'
    };
  });

  test('should create a new employee with all fields', () => {
    const employee = new Employee(employeeData);

    expect(employee.name).toBe(employeeData.name);
    expect(employee.email).toBe(employeeData.email);
    expect(employee.phone).toBe(employeeData.phone);
    expect(employee.position).toBe(employeeData.position);
  });

  test('should have position field', () => {
    const employee = new Employee(employeeData);

    expect(employee.position).toBe('Chef');
  });

  test('should have department field', () => {
    const employee = new Employee(employeeData);

    expect(employee.department).toBe('Kitchen');
  });

  test('should have salary field', () => {
    const employee = new Employee(employeeData);

    expect(employee.salary).toBe(25000);
  });

  test('should have joinDate field', () => {
    const employee = new Employee(employeeData);

    expect(employee.joinDate).toBeDefined();
    expect(employee.joinDate instanceof Date).toBe(true);
  });

  test('should have experience field', () => {
    const employee = new Employee(employeeData);

    expect(employee.experience).toBe(5);
  });

  test('should have skills array', () => {
    const employee = new Employee(employeeData);

    expect(Array.isArray(employee.skills)).toBe(true);
    expect(employee.skills).toContain('Cooking');
    expect(employee.skills.length).toBe(3);
  });

  test('should have address field', () => {
    const employee = new Employee(employeeData);

    expect(employee.address).toBe('123 Main Street, Kathmandu');
  });

  test('should have status field', () => {
    const employee = new Employee(employeeData);

    expect(employee.status).toBe('active');
  });

  test('should have idProof field', () => {
    const employee = new Employee(employeeData);

    expect(employee.idProof).toBe('https://example.com/id.jpg');
  });

  test('should have createdAt timestamp', () => {
    const employee = new Employee(employeeData);

    expect(employee.createdAt).toBeDefined();
    expect(employee.createdAt instanceof Date).toBe(true);
  });

  test('should have updatedAt timestamp', () => {
    const employee = new Employee(employeeData);

    expect(employee.updatedAt).toBeDefined();
  });

  test('should accept different positions', () => {
    const positions = ['Chef', 'Manager', 'Waiter', 'Delivery Personnel'];

    positions.forEach(position => {
      employeeData.position = position;
      const employee = new Employee(employeeData);
      expect(employee.position).toBe(position);
    });
  });

  test('should accept different departments', () => {
    const departments = ['Kitchen', 'Service', 'Admin', 'Delivery'];

    departments.forEach(dept => {
      employeeData.department = dept;
      const employee = new Employee(employeeData);
      expect(employee.department).toBe(dept);
    });
  });

  test('should accept different employee statuses', () => {
    const statuses = ['active', 'inactive', 'on_leave'];

    statuses.forEach(status => {
      employeeData.status = status;
      const employee = new Employee(employeeData);
      expect(employee.status).toBe(status);
    });
  });

  test('should allow editing name', () => {
    const employee = new Employee(employeeData);
    employee.name = 'Sita Sharma';

    expect(employee.name).toBe('Sita Sharma');
  });

  test('should allow editing email', () => {
    const employee = new Employee(employeeData);
    employee.email = 'sita@example.com';

    expect(employee.email).toBe('sita@example.com');
  });

  test('should allow editing salary', () => {
    const employee = new Employee(employeeData);
    employee.salary = 30000;

    expect(employee.salary).toBe(30000);
  });

  test('should allow adding skills', () => {
    const employee = new Employee(employeeData);
    const initialSkills = employee.skills.length;

    employee.skills.push('Leadership');

    expect(employee.skills.length).toBe(initialSkills + 1);
    expect(employee.skills).toContain('Leadership');
  });

  test('should allow removing skills', () => {
    const employee = new Employee(employeeData);
    employee.skills.pop();

    expect(employee.skills.length).toBe(2);
  });

  test('should have multiple employees with different data', () => {
    const employee1 = new Employee(employeeData);

    const employee2Data = { ...employeeData, email: 'hari@example.com', name: 'Hari Bista' };
    const employee2 = new Employee(employee2Data);

    expect(employee1.name).not.toBe(employee2.name);
    expect(employee1.email).not.toBe(employee2.email);
  });

  test('should accept various salary ranges', () => {
    const salaries = [15000, 25000, 35000, 50000];

    salaries.forEach(salary => {
      employeeData.salary = salary;
      const employee = new Employee(employeeData);
      expect(employee.salary).toBe(salary);
    });
  });

  test('should accept various experience levels', () => {
    const experiences = [0, 1, 5, 10, 20];

    experiences.forEach(exp => {
      employeeData.experience = exp;
      const employee = new Employee(employeeData);
      expect(employee.experience).toBe(exp);
    });
  });

  test('should maintain skills array integrity', () => {
    const employee = new Employee(employeeData);
    const originalSkills = [...employee.skills];

    employee.skills.push('New Skill');

    expect(employee.skills).toEqual([...originalSkills, 'New Skill']);
  });

  test('should preserve all fields', () => {
    const employee = new Employee(employeeData);

    expect(employee.name).toBeDefined();
    expect(employee.email).toBeDefined();
    expect(employee.phone).toBeDefined();
    expect(employee.position).toBeDefined();
    expect(employee.department).toBeDefined();
    expect(employee.salary).toBeDefined();
    expect(employee.joinDate).toBeDefined();
    expect(employee.experience).toBeDefined();
    expect(employee.skills).toBeDefined();
    expect(employee.address).toBeDefined();
    expect(employee.status).toBeDefined();
    expect(employee.idProof).toBeDefined();
  });

  test('should handle empty skills array', () => {
    employeeData.skills = [];

    const employee = new Employee(employeeData);

    expect(employee.skills).toHaveLength(0);
  });

  test('should validate phone number format', () => {
    employeeData.phone = '+977-9841234567';

    const employee = new Employee(employeeData);

    expect(employee.phone).toMatch(/\+977/);
  });

  test('should accept minimal employee data', () => {
    const minimalData = {
      name: 'Ram',
      email: 'ram@example.com'
    };

    const employee = new Employee(minimalData);

    expect(employee.name).toBe('Ram');
    expect(employee.email).toBe('ram@example.com');
  });

  test('should handle long names', () => {
    employeeData.name = 'Ramakrishna Narayan Singh Sharma';

    const employee = new Employee(employeeData);

    expect(employee.name).toBe('Ramakrishna Narayan Singh Sharma');
  });

  test('should handle special characters in address', () => {
    employeeData.address = "123 O'Reilly St, #456, Kathmandu";

    const employee = new Employee(employeeData);

    expect(employee.address).toContain("O'Reilly");
  });

  test('should update status from active to inactive', () => {
    const employee = new Employee(employeeData);

    expect(employee.status).toBe('active');

    employee.status = 'inactive';

    expect(employee.status).toBe('inactive');
  });

  test('should track joinDate accurately', () => {
    const joinDate = new Date('2023-06-15');
    employeeData.joinDate = joinDate;

    const employee = new Employee(employeeData);

    expect(employee.joinDate.getFullYear()).toBe(2023);
    expect(employee.joinDate.getMonth()).toBe(5);
  });

  test('should handle multiple skills', () => {
    employeeData.skills = ['Cooking', 'Baking', 'Menu Planning', 'Staff Training', 'Inventory Management'];

    const employee = new Employee(employeeData);

    expect(employee.skills).toHaveLength(5);
  });
});
