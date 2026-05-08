import { createBrowserRouter } from "react-router";
import Dashboard from "./Dashboard";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Dashboard,
  },
]);
