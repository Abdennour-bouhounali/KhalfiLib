export type RootStackParamList = {
    MainTabs: undefined;
    AddBook: { bookId?: string };
    AddStudent: { studentId?: string };
    BookDetails: { bookId: string };
    StudentDetails: { studentId: string };
};

export type MainTabParamList = {
    Home: undefined;
    Books: undefined;
    Fields: undefined;
    Students: undefined;
    BorrowReturn: undefined;
    Settings: undefined;
};
