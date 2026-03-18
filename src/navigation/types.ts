export type RootStackParamList = {
    // Auth Stacks
    Login: undefined;
    Register: undefined;
    PublicCatalog: undefined;
    PendingAccount: undefined;

    // Role Stacks
    StudentHome: undefined;
    StudentTabs: undefined;
    SuperAdminTabs: undefined;
    AdminManagement: undefined;
    Settings: undefined;

    // Existing Stacks
    MainTabs: undefined;
    AddBook: { bookId?: string };
    AddStudent: { studentId?: string };
    BookDetails: { bookId: string };
    BookChat: { bookId: string };
    StudentDetails: { studentId: string };
    ManageSubscription: { studentId: string };
    AdminSubscriptions: undefined;
    Notifications: undefined;
    SendNotification: undefined;
};

export type MainTabParamList = {
    Home: undefined;
    Security: undefined;
    Library: undefined;
    Books: undefined;
    Fields: undefined;
    Students: undefined;
    BorrowReturn: undefined;
    Catalog: undefined;
    LibraryChat: undefined;
    PublicCatalog: undefined;
    Settings: undefined;
};
export type SuperAdminTabParamList = {
    Home: undefined;
    Dashboard: undefined;
    Security: undefined;
    Admins: undefined;
    Catalog: undefined;
    LibraryChat: undefined;
    PublicCatalog: undefined;
    Settings: undefined;
};

export type StudentTabParamList = {
    Home: undefined;
    Security: undefined;
    Catalog: undefined;
    LibraryChat: undefined;
    PublicCatalog: undefined;
    Notifications: undefined;
    Settings: undefined;
};
