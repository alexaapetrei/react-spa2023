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
    <div className="border-base-300 bg-base-100 rounded-b-box rounded-tr-box flex min-h-[6rem] min-w-[10rem] flex-wrap items-center justify-center gap-2 overflow-x-hidden border bg-cover bg-top p-4 m-4">
      <div className="card w-69 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Probabil a explodat ceva</h2>
          <i>{error?.statusText || error?.message}</i>
          <p>Stai chill si apasa butonu</p>

          <div className="card-actions justify-end">
            <Link to="/" className="btn btn-block btn-warning">
              Go home
            </Link>
          </div>
        </div>
        <figure>
          <img src="/bear2023.svg" alt="Bravo" />
        </figure>
      </div>
    </div>
  );
};

export default ErrorPage;
