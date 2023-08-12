import React from "react";
import { useRouteError, Link } from "react-router-dom";

type error = {
  statusText?: string;
  message?: string;
};
const ErrorPage: React.FC = () => {
  const error: error = useRouteError() as error;

  console.error(error);

  return (
    <div className="px-4 py-8 mx-auto bg-orange-500">
      <div className="max-w-screen-md mx-auto flex flex-col items-center justify-center">
        <img
          data-fresh-disable-lock
          className="my-6"
          src="/bear2023.svg"
          width="128"
          height="128"
          alt="Dang Bear"
        />
        <h1 className="text-4xl font-bold">
          <i>{error?.statusText || error?.message}</i>
        </h1>
        <p className="my-4">Not here bro</p>
        <Link to="/" className="underline">
          Go home
        </Link>
      </div>
    </div>
  );
};

export default ErrorPage;
